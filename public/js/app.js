/**
 * SuPrabhaat Web Application Client Logic
 * Default filter: Monday (Somvaar)
 */

let currentFilterDay = 'monday';
let allDaysList = [];
let currentImages = [];
let currentStatus = null;
let selectedModalImage = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initLiveClock();
  fetchDaysAndInitializeFilters();
  fetchSystemStatus();
  setInterval(fetchSystemStatus, 6000); // Poll status every 6s for QR & WhatsApp health

  // Keyboard shortcut: Escape closes any active modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      closeDispatchModal();
      closeWhatsAppModal();
      closeHistoryModal();
    }
  });
});

/**
 * Updates live IST clock
 */
function initLiveClock() {
  const clockEl = document.getElementById('liveClock');
  const update = () => {
    const now = new Date();
    const istString = now.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    if (clockEl) clockEl.textContent = `${istString} IST`;
  };
  update();
  setInterval(update, 1000);
}

/**
 * Fetches days metadata and builds filter tabs with Monday as default
 */
async function fetchDaysAndInitializeFilters() {
  try {
    const res = await fetch('/api/days');
    const data = await res.json();
    allDaysList = data.days || [];

    renderFilterTabs();
    populateModalDaySelect();
    
    // Load Monday images by default
    setFilterDay('monday');
  } catch (err) {
    console.error('Error fetching days:', err);
    showToast('Failed to load day configuration', 'error');
  }
}

/**
 * Renders the day filter tabs (Monday, Tuesday ... All Days)
 */
function renderFilterTabs() {
  const container = document.getElementById('dayFilterTabs');
  if (!container) return;

  let html = '';

  allDaysList.forEach((day) => {
    const isActive = day.id === currentFilterDay;
    html += `
      <div class="filter-tab ${isActive ? 'active' : ''}" onclick="setFilterDay('${day.id}')" id="tab-${day.id}">
        <span class="tab-day-name">
          ${day.name}
          <span class="tab-hindi">${day.hindiDay}</span>
        </span>
        <span class="tab-deity">${day.deity.split('/')[0]}</span>
      </div>
    `;
  });

  // Add "All Images" Tab
  const isAllActive = currentFilterDay === 'all';
  html += `
    <div class="filter-tab ${isAllActive ? 'active' : ''}" onclick="setFilterDay('all')" id="tab-all">
      <span class="tab-day-name">
        All Days
        <span class="tab-hindi">सभी चित्र</span>
      </span>
      <span class="tab-deity">Complete Library</span>
    </div>
  `;

  container.innerHTML = html;
}

/**
 * Changes the current filter day and refreshes the gallery
 */
async function setFilterDay(dayId) {
  currentFilterDay = dayId;

  // Update tab active classes
  document.querySelectorAll('.filter-tab').forEach((el) => el.classList.remove('active'));
  const activeTab = document.getElementById(`tab-${dayId}`);
  if (activeTab) activeTab.classList.add('active');

  const galleryEl = document.getElementById('galleryGrid');
  galleryEl.innerHTML = `
    <div class="loading-spinner-container">
      <div class="spiritual-spinner"></div>
      <p>Loading sacred artworks for ${dayId.toUpperCase()}...</p>
    </div>
  `;

  try {
    const res = await fetch(`/api/images?day=${dayId}`);
    const data = await res.json();
    currentImages = data.images || [];

    const countDisplay = document.getElementById('imageCountDisplay');
    if (countDisplay) {
      countDisplay.textContent = `${currentImages.length} Ready`;
    }

    renderGallery();
  } catch (err) {
    console.error('Error fetching images:', err);
    galleryEl.innerHTML = `<div class="loading-spinner-container"><p>Error loading images: ${err.message}</p></div>`;
  }
}

/**
 * Renders gallery cards
 */
function renderGallery() {
  const galleryEl = document.getElementById('galleryGrid');
  if (!galleryEl) return;

  if (currentImages.length === 0) {
    galleryEl.innerHTML = `
      <div class="loading-spinner-container">
        <p>No images found for this filter. Click "Send On Demand" to generate one!</p>
      </div>
    `;
    return;
  }

  galleryEl.innerHTML = currentImages
    .map((item) => {
      const blessingLines = (item.sampleBlessing || '').replace(/\n/g, '<br>');
      return `
        <article class="image-card">
          <div class="card-media" onclick="openLightbox('${item.id}')">
            <img src="${item.url}" alt="${escapeHtml(item.deity)}" class="card-img" loading="lazy">
            <span class="card-overlay-badge">${escapeHtml(item.dayName)} • ${escapeHtml(item.greetingEnglish)}</span>
            <span class="card-overlay-hindi">${escapeHtml(item.greetingHindi)}</span>
            <span class="card-overlay-timestamp">🕒 ${escapeHtml(item.formattedDate || 'Curated Asset')}</span>
          </div>

          <div class="card-body">
            <h4 class="card-deity-title">${escapeHtml(item.deity)}</h4>
            <div class="card-theme">${escapeHtml(item.theme || '')}</div>
            <div class="card-blessing">${blessingLines}</div>

            <div class="card-actions">
              <button class="btn btn-primary btn-sm" onclick="openDispatchModalWithItem('${item.id}')">
                <span>⚡ Send This Blessing</span>
              </button>
              <button class="btn btn-secondary btn-sm" onclick="openLightbox('${item.id}')">
                <span>🔍 View</span>
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

/**
 * Fetches status of WhatsApp, Facebook, Cron Scheduler
 */
async function fetchSystemStatus() {
  try {
    const res = await fetch('/api/status');
    currentStatus = await res.json();

    updateWhatsAppBadge(currentStatus.whatsapp);
    updateSchedulerDisplay(currentStatus.scheduler);
  } catch (err) {
    console.warn('Status poll error:', err.message);
  }
}

/**
 * Updates WhatsApp connection badge in header
 */
function updateWhatsAppBadge(wa) {
  const badge = document.getElementById('waStatusBadge');
  const text = document.getElementById('waStatusText');
  const qrContainer = document.getElementById('waQrContainer');

  if (!badge || !text) return;

  badge.className = 'status-badge';

  if (wa?.connected) {
    badge.classList.add('status-connected');
    text.textContent = `WhatsApp: Connected (${wa.user || 'Active'})`;
    if (qrContainer) {
      qrContainer.innerHTML = `
        <div style="padding: 1.5rem; color: #166534; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">✅</div>
          <h3 style="margin-bottom: 0.25rem;">WhatsApp Web Connected!</h3>
          <p style="color: #15803d; font-size: 0.9rem;">
            Session active as <strong>${wa.user || 'Active User'}</strong>. Morning blessings will be dispatched automatically.
          </p>
          <div style="margin-top: 1.25rem; border-top: 1px solid #dcfce7; padding-top: 1rem;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="triggerWhatsAppLogout()">
              🚪 Unlink / Switch Phone Number
            </button>
          </div>
        </div>
      `;
    }
  } else if (wa?.status === 'AUTHENTICATING') {
    badge.classList.add('status-authenticating');
    const syncText = wa.loadingPercent !== null && wa.loadingPercent !== undefined
      ? `WhatsApp: Syncing (${wa.loadingPercent}%)`
      : 'WhatsApp: Linking & Syncing...';
    text.textContent = syncText;
    if (qrContainer) {
      qrContainer.innerHTML = `
        <div style="padding: 1.5rem; text-align: center;">
          <div style="font-size: 2.8rem; margin-bottom: 0.5rem;">📲</div>
          <h3 style="color: #d97706; margin-bottom: 0.35rem;">Phone Linked! Syncing Session...</h3>
          <p style="color: #6b7280; font-size: 0.85rem; margin-bottom: 1rem;">
            WhatsApp verified your phone successfully. Downloading chat history and securing connection...
          </p>
          ${wa.loadingPercent !== null && wa.loadingPercent !== undefined ? `
            <div style="background: #e5e7eb; border-radius: 9999px; height: 10px; overflow: hidden; width: 80%; margin: 0.5rem auto;">
              <div style="background: #f59e0b; height: 100%; width: ${wa.loadingPercent}%; transition: width 0.3s;"></div>
            </div>
            <p style="font-size: 0.8rem; color: #b45309; margin-top: 0.5rem; font-weight: 600;">
              ${wa.loadingPercent}% &bull; ${wa.loadingMessage || 'Syncing chats'}
            </p>
          ` : `
            <div class="spiritual-spinner" style="margin: 0 auto;"></div>
            <p style="font-size: 0.8rem; color: #92400e; margin-top: 0.5rem;">Securing session in container...</p>
          `}
        </div>
      `;
    }
  } else if (wa?.hasQr && wa?.qrCodeDataUrl) {
    badge.classList.add('status-scanning');
    text.textContent = 'WhatsApp: Click to Scan QR';
    if (qrContainer) {
      qrContainer.innerHTML = `
        <img src="${wa.qrCodeDataUrl}" alt="WhatsApp QR Code" class="qr-image">
        <p style="margin-top: 0.75rem; font-size: 0.8rem; color: #6b7280;">QR code refreshes automatically</p>
        <div style="margin-top: 0.75rem;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="triggerWhatsAppRestart(false)">
            🔄 Reload QR Code
          </button>
        </div>
      `;
    }
  } else {
    badge.classList.add('status-disconnected');
    text.textContent = `WhatsApp: ${wa?.status || 'Offline'}`;
    if (qrContainer) {
      qrContainer.innerHTML = wa?.status === 'INITIALIZING' ? `
        <div class="spiritual-spinner" style="margin: 0 auto;"></div>
        <p style="margin-top: 0.75rem; font-weight: 600; color: #4b5563;">Launching WhatsApp Web in container...</p>
        <p style="font-size: 0.8rem; color: #6b7280; margin-top: 0.25rem;">Chromium is starting. QR code will appear in seconds.</p>
      ` : `
        <div style="padding: 1.5rem; text-align: center;">
          <div style="font-size: 2.8rem; margin-bottom: 0.5rem;">⚠️</div>
          <h3 style="color: #b91c1c; margin-bottom: 0.25rem;">WhatsApp Disconnected</h3>
          <p style="font-size: 0.85rem; color: #6b7280; margin-bottom: 1rem;">
            ${wa?.initError || 'Session is not active or has expired on your phone. Click below to reconnect and scan a fresh QR code.'}
          </p>
          <button type="button" class="btn btn-primary" onclick="triggerWhatsAppRestart(true)">
            🔄 Reconnect & Generate New QR
          </button>
        </div>
      `;
    }
  }

  // Update modal recipient summary
  const waRecSummary = document.getElementById('waRecipientSummary');
  if (waRecSummary && wa?.configuredRecipientsCount !== undefined) {
    waRecSummary.textContent = `(${wa.configuredRecipientsCount} recipients)`;
  }
}

/**
 * Triggers WhatsApp service restart (with optional session purge)
 */
async function triggerWhatsAppRestart(purge = false) {
  const qrContainer = document.getElementById('waQrContainer');
  if (qrContainer) {
    qrContainer.innerHTML = `
      <div class="spiritual-spinner" style="margin: 0 auto;"></div>
      <p style="margin-top: 0.75rem; color: #b45309; font-weight: 600;">
        ${purge ? 'Purging session and regenerating fresh QR code...' : 'Restarting WhatsApp client...'}
      </p>
    `;
  }

  try {
    const res = await fetch('/api/whatsapp/restart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purgeSession: purge })
    });
    const data = await res.json();
    console.log('[WhatsApp]', data.message);
    setTimeout(fetchSystemStatus, 1500);
  } catch (err) {
    console.error('Error restarting WhatsApp:', err);
  }
}

/**
 * Unlinks WhatsApp session and generates fresh QR
 */
async function triggerWhatsAppLogout() {
  const confirmed = confirm('Are you sure you want to unlink WhatsApp? This will remove the active session and generate a fresh QR code.');
  if (!confirmed) return;

  const qrContainer = document.getElementById('waQrContainer');
  if (qrContainer) {
    qrContainer.innerHTML = `
      <div class="spiritual-spinner" style="margin: 0 auto;"></div>
      <p style="margin-top: 0.75rem; color: #b45309; font-weight: 600;">Unlinking WhatsApp session and generating new QR...</p>
    `;
  }

  try {
    const res = await fetch('/api/whatsapp/logout', { method: 'POST' });
    const data = await res.json();
    console.log('[WhatsApp]', data.message);
    setTimeout(fetchSystemStatus, 1500);
  } catch (err) {
    console.error('Error logging out WhatsApp:', err);
  }
}

window.triggerWhatsAppRestart = triggerWhatsAppRestart;
window.triggerWhatsAppLogout = triggerWhatsAppLogout;

/**
 * Updates scheduler time display
 */
function updateSchedulerDisplay(sched) {
  const cronEl = document.getElementById('cronTimeDisplay');
  if (cronEl && sched?.cronSchedule) {
    cronEl.textContent = `${sched.cronSchedule} (${sched.timezone})`;
  }
}

/**
 * Modal Handling: On-Demand Send
 */
function populateModalDaySelect() {
  const select = document.getElementById('modalDaySelect');
  if (!select) return;

  select.innerHTML = allDaysList
    .map((day) => `<option value="${day.id}" ${day.id === 'monday' ? 'selected' : ''}>${day.name} (${day.hindiDay}) - ${day.deity}</option>`)
    .join('');
}

let currentBlessingRequestId = 0;

/**
 * Returns the traditional default devotional blessing matching the specific day & deity
 */
function getDefaultBlessingForDay(dayId) {
  const day = allDaysList.find((d) => d.id === dayId);
  if (day?.sampleBlessings && day.sampleBlessings.length > 0) {
    return day.sampleBlessings[0];
  }

  // Cultural Vedic fallback dictionary per day & deity
  const curatedBlessings = {
    monday: 'May the divine grace of Mahadev bring profound peace and serenity to your soul.\nWishing you a calm, purposeful, and blessed Monday! 🌸🕉️',
    tuesday: 'May Sankat Mochan Hanuman ji bless you with boundless courage and protect you from all harm.\nWishing you a vibrant, triumphant, and energetic Tuesday! 🚩🙏',
    wednesday: 'May Vighnaharta Lord Ganesha remove every obstacle and illuminate your mind with divine intellect.\nWishing you a prosperous, creative, and joyful Wednesday! 🐘🌸',
    thursday: 'May the gentle music of Shri Krishna’s flute inspire peace, virtue, and compassion in your life.\nWishing you a spiritually uplifting and tranquil Thursday! 🦚🌸',
    friday: 'May Devi Mahalakshmi shower your home with everlasting prosperity, radiant health, and contentment.\nWishing you a joyful, abundant, and blessed Friday! 🪷💰',
    saturday: 'May Lord Shani Dev reward your righteous deeds, steady your patience, and guide your moral journey.\nWishing you a disciplined, balanced, and peaceful Saturday! ⚖️🙏',
    sunday: 'May the golden rays of Surya Bhagwan dispel all shadows and infuse your day with vitality and light.\nWishing you an invigorating, healthy, and luminous Sunday! ☀️🌸'
  };

  return curatedBlessings[dayId] || curatedBlessings.monday;
}

let currentModalDayImages = [];

function selectModalImage(imageId) {
  const found = currentModalDayImages.find((img) => img.id === imageId);
  if (found) {
    selectedModalImage = found;
    const dayConfig = allDaysList.find((d) => d.id === found.day) || allDaysList[0];
    updateModalArtworkCard(selectedModalImage, dayConfig, currentModalDayImages);

    // Also update sample blessing if user hasn't typed a custom one
    const textarea = document.getElementById('modalBlessingText');
    if (textarea && found.sampleBlessing) {
      textarea.value = found.sampleBlessing;
    }
  }
}

function openDispatchModal(dayOverride) {
  const modal = document.getElementById('dispatchModal');
  modal.classList.remove('hidden');

  let selectedDay = dayOverride;
  if (!selectedDay) {
    if (currentFilterDay && currentFilterDay !== 'all') {
      selectedDay = currentFilterDay;
    } else {
      const todayIndex = new Date().getDay();
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      selectedDay = daysOfWeek[todayIndex] || 'monday';
    }
  }

  const select = document.getElementById('modalDaySelect');
  if (select) select.value = selectedDay;

  handleModalDayChange(selectedDay);
}

function openDispatchModalWithItem(imageId) {
  const item = currentImages.find((img) => img.id === imageId);
  if (!item) {
    openDispatchModal();
    return;
  }

  const modal = document.getElementById('dispatchModal');
  modal.classList.remove('hidden');

  const select = document.getElementById('modalDaySelect');
  if (select) select.value = item.day;

  // Immediately populate the blessing tailored specifically to this day & deity
  const textarea = document.getElementById('modalBlessingText');
  if (textarea) {
    textarea.value = item.sampleBlessing || getDefaultBlessingForDay(item.day);
  }

  handleModalDayChange(item.day, item.id);
}

function closeDispatchModal() {
  document.getElementById('dispatchModal').classList.add('hidden');
  document.getElementById('dispatchResultArea').classList.add('hidden');
}

async function handleModalDayChange(dayId, preferredImageId) {
  const dayConfig = allDaysList.find((d) => d.id === dayId) || allDaysList[0];

  // Immediately display the authentic traditional blessing for this selected day & deity
  const textarea = document.getElementById('modalBlessingText');
  if (textarea && !textarea.value) {
    textarea.value = getDefaultBlessingForDay(dayId);
  }

  // Fetch images for this day to retrieve all available versions
  try {
    const res = await fetch(`/api/images?day=${dayId}`);
    const data = await res.json();
    currentModalDayImages = data.images || [];
  } catch (_) {
    currentModalDayImages = currentImages.filter((img) => img.day === dayId);
  }

  // Pick preferred image if specified, otherwise default to freshest/newest image (index 0)
  if (preferredImageId) {
    selectedModalImage = currentModalDayImages.find((img) => img.id === preferredImageId) || currentModalDayImages[0] || null;
  } else {
    selectedModalImage = currentModalDayImages[0] || null;
  }

  updateModalArtworkCard(selectedModalImage, dayConfig, currentModalDayImages);

  // Fetch AI blessing preview tailored specifically to this day
  await regenerateAiBlessing(dayId);
}

function updateModalArtworkCard(item, dayConfig, allDayImages = []) {
  const preview = document.getElementById('modalArtworkPreview');
  if (!preview) return;

  const hasMultiple = allDayImages && allDayImages.length > 1;

  let stripHtml = '';
  if (hasMultiple) {
    stripHtml = `
      <div style="margin-top: 0.65rem; border-top: 1px dashed #e5e7eb; padding-top: 0.5rem; width: 100%;">
        <div style="font-size: 0.74rem; font-weight: 600; color: #4b5563; margin-bottom: 0.35rem; display: flex; justify-content: space-between;">
          <span>Artwork Versions (${allDayImages.length} available - click to select):</span>
          <span style="font-size: 0.7rem; color: #166534;">* Defaults to Latest</span>
        </div>
        <div class="preview-thumb-strip">
          ${allDayImages.map((img, idx) => `
            <img src="${img.url}" 
                 alt="${img.deity}" 
                 class="thumb-strip-item ${img.id === item?.id ? 'active' : ''}" 
                 onclick="selectModalImage('${img.id}')"
                 title="${idx === 0 ? 'Latest: ' : 'Version: '}${img.formattedDate || img.filename}">
          `).join('')}
        </div>
      </div>
    `;
  }

  if (item) {
    const isFreshest = allDayImages[0]?.id === item.id;
    preview.innerHTML = `
      <div style="display: flex; gap: 1rem; align-items: center; width: 100%;">
        <img src="${item.url}" alt="${item.deity}" class="preview-thumb">
        <div class="preview-info">
          <div class="preview-deity">
            ${item.deity} 
            ${isFreshest ? '<span style="font-size: 0.68rem; background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; margin-left: 6px; font-weight: 600;">Latest</span>' : ''}
          </div>
          <div class="preview-meta">${item.dayName} • ${item.greetingHindi} (${item.greetingEnglish})</div>
          <div class="preview-meta" style="font-size: 0.72rem; color: #9ca3af;">🕒 ${item.formattedDate || 'Curated Asset'}</div>
        </div>
      </div>
      ${stripHtml}
    `;
  } else if (dayConfig) {
    preview.innerHTML = `
      <div class="preview-info">
        <div class="preview-deity">${dayConfig.deity}</div>
        <div class="preview-meta">${dayConfig.name} • ${dayConfig.greetingHindi} (${dayConfig.greetingEnglish})</div>
      </div>
    `;
  }
}

/**
 * Calls AI service to generate a fresh 2-line blessing for the modal
 */
async function regenerateAiBlessing(dayIdOverride) {
  const select = document.getElementById('modalDaySelect');
  const dayId = dayIdOverride || select?.value || 'monday';
  const textarea = document.getElementById('modalBlessingText');

  currentBlessingRequestId += 1;
  const thisRequestId = currentBlessingRequestId;

  textarea.value = `Invoking divine blessings for ${dayId.toUpperCase()} with Gemini AI...`;

  try {
    const res = await fetch('/api/blessing/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day: dayId })
    });
    const data = await res.json();

    // Prevent race conditions if the user switched day while waiting
    if (thisRequestId !== currentBlessingRequestId) return;

    if (data.success && data.blessing) {
      textarea.value = data.blessing;
    } else {
      textarea.value = getDefaultBlessingForDay(dayId);
    }
  } catch (err) {
    if (thisRequestId !== currentBlessingRequestId) return;
    console.warn(`Error generating AI blessing for ${dayId}:`, err);
    textarea.value = getDefaultBlessingForDay(dayId);
  }
}

/**
 * Handles On-Demand Submit
 */
async function handleDispatchSubmit(event) {
  event.preventDefault();

  const btnSend = document.getElementById('btnSendNow');
  const btnText = document.getElementById('btnSendNowText');
  const resultArea = document.getElementById('dispatchResultArea');

  const day = document.getElementById('modalDaySelect').value;
  const customBlessing = document.getElementById('modalBlessingText').value.trim();
  const sendWhatsApp = document.getElementById('channelWhatsApp').checked;
  const sendFacebook = document.getElementById('channelFacebook').checked;
  const dryRun = document.getElementById('modalDryRun').checked;
  const customRecipientsRaw = document.getElementById('modalCustomRecipients').value.trim();

  const channels = [];
  if (sendWhatsApp) channels.push('whatsapp');
  if (sendFacebook) channels.push('facebook');

  if (channels.length === 0) {
    showToast('Please select at least one dispatch channel (WhatsApp or Facebook)', 'error');
    return;
  }

  const customRecipients = customRecipientsRaw
    ? customRecipientsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : undefined;

  // Set loading state
  btnSend.disabled = true;
  btnText.textContent = 'Dispatching Sacred Blessings...';
  resultArea.className = 'dispatch-result-box hidden';

  try {
    const res = await fetch('/api/dispatch/on-demand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day,
        imageId: selectedModalImage?.id,
        customBlessing,
        channels,
        dryRun,
        recipients: customRecipients
      })
    });

    const data = await res.json();

    if (data.success) {
      showToast('Morning blessings dispatched successfully! 🌸', 'success');
      resultArea.className = 'dispatch-result-box dispatch-success';
      resultArea.innerHTML = `
        <h4>✨ Dispatch Successful!</h4>
        <p><strong>Deity:</strong> ${data.result.deity} (${data.result.greetingHindi})</p>
        <p><strong>Channels:</strong> ${channels.join(', ').toUpperCase()} ${data.result.isDryRun ? '(Dry-Run)' : ''}</p>
        <p><strong>Blessing:</strong></p>
        <pre style="white-space: pre-wrap; font-family: inherit; margin: 0.5rem 0;">${data.result.blessingText}</pre>
        <small style="color: #166534;">Dispatch ID: ${data.result.id}</small>
      `;
      resultArea.classList.remove('hidden');
    } else {
      throw new Error(data.error || 'Failed to dispatch blessings');
    }
  } catch (err) {
    console.error('Dispatch error:', err);
    showToast(err.message, 'error');
    resultArea.className = 'dispatch-result-box dispatch-error';
    resultArea.innerHTML = `
      <h4>⚠️ Dispatch Notice</h4>
      <p>${err.message}</p>
      <small>Check WhatsApp connectivity or enable Dry-Run mode to simulate without errors.</small>
    `;
    resultArea.classList.remove('hidden');
  } finally {
    btnSend.disabled = false;
    btnText.textContent = 'Send Blessings Now';
  }
}

/**
 * Triggers Today's Routine immediately
 */
async function triggerScheduledRunNow() {
  if (!confirm("Trigger today's scheduled morning blessings routine now?")) return;

  try {
    showToast("Triggering today's routine...", 'info');
    const res = await fetch('/api/scheduler/trigger', { method: 'POST' });
    const data = await res.json();

    if (data.success) {
      showToast(`Today's blessings dispatched! (${data.result.deity})`, 'success');
    } else {
      showToast(data.error || 'Trigger failed', 'error');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * WhatsApp Modal Controls
 */
function openWhatsAppModal() {
  document.getElementById('waModal').classList.remove('hidden');
  fetchSystemStatus();
}
function closeWhatsAppModal() {
  document.getElementById('waModal').classList.add('hidden');
}

/**
 * Lightbox Modal Controls
 */
function openLightbox(target, title, blessing) {
  const modal = document.getElementById('lightboxModal');
  const imgEl = document.getElementById('lightboxImage');
  const titleEl = document.getElementById('lightboxTitle');
  const blessingEl = document.getElementById('lightboxBlessing');

  if (!modal || !imgEl || !titleEl || !blessingEl) return;

  // Resolve by ID or filename from current in-memory collection
  const item = currentImages.find((img) => img.id === target || img.filename === target);
  if (item) {
    imgEl.src = item.url;
    titleEl.textContent = `${item.deity} • ${item.greetingHindi} (${item.greetingEnglish})`;
    blessingEl.innerHTML = (item.sampleBlessing || '').replace(/\n/g, '<br>');
  } else {
    imgEl.src = target || '';
    titleEl.textContent = title || 'Sacred Deity Artwork';
    blessingEl.innerHTML = (blessing || '').replace(/\n/g, '<br>');
  }

  modal.classList.remove('hidden');
}

function closeLightbox() {
  const modal = document.getElementById('lightboxModal');
  if (modal) modal.classList.add('hidden');
}

/**
 * History Modal Controls
 */
async function openHistoryModal() {
  const modal = document.getElementById('historyModal');
  const body = document.getElementById('historyModalBody');
  modal.classList.remove('hidden');

  body.innerHTML = `
    <div class="loading-spinner-container">
      <div class="spiritual-spinner"></div>
      <p>Loading dispatch history...</p>
    </div>
  `;

  try {
    const res = await fetch('/api/history');
    const data = await res.json();
    const history = data.history || [];

    if (history.length === 0) {
      body.innerHTML = '<p class="text-center" style="padding: 2rem; color: #6b7280;">No dispatches recorded yet in this session.</p>';
      return;
    }

    body.innerHTML = history
      .map((item) => `
        <div class="history-item">
          <div class="history-header">
            <span class="history-day">${item.dayName} • ${item.deity}</span>
            <span class="history-time">${new Date(item.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
          </div>
          <div class="history-text">${item.blessingText.replace(/\n/g, '<br>')}</div>
          <div class="history-badges">
            ${item.isDryRun ? '<span class="badge-pill badge-dry">Dry-Run</span>' : ''}
            ${item.channels?.whatsapp ? '<span class="badge-pill badge-wa">WhatsApp</span>' : ''}
            ${item.channels?.facebook ? '<span class="badge-pill badge-fb">Facebook</span>' : ''}
          </div>
        </div>
      `)
      .join('');
  } catch (err) {
    body.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`;
  }
}
function closeHistoryModal() {
  document.getElementById('historyModal').classList.add('hidden');
}

/**
 * Toast Notifications
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-msg">${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function handleModalBackdropClick(event, modalId) {
  if (event.target.id === modalId) {
    document.getElementById(modalId).classList.add('hidden');
  }
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
