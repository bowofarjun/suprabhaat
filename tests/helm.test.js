import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';

const chartDir = path.resolve('deploy/charts/morning-bot');

test('Helm Chart.yaml exists and contains valid metadata', () => {
  const chartYamlPath = path.join(chartDir, 'Chart.yaml');
  assert.ok(fs.existsSync(chartYamlPath), 'Chart.yaml must exist');
  const content = fs.readFileSync(chartYamlPath, 'utf8');
  assert.ok(content.includes('apiVersion: v2'));
  assert.ok(content.includes('name: morning-bot'));
  assert.ok(content.includes('appVersion: "1.0.0"'));
  assert.ok(content.includes('bowofarjun'));
});

test('Helm values.yaml exists and contains required specifications', () => {
  const valuesYamlPath = path.join(chartDir, 'values.yaml');
  assert.ok(fs.existsSync(valuesYamlPath), 'values.yaml must exist');
  const content = fs.readFileSync(valuesYamlPath, 'utf8');
  
  // Verify PVC persistence specification
  assert.ok(content.includes('persistence:'), 'Persistence block must exist');
  assert.ok(content.includes('/app/.wwebjs_auth'), 'PVC must mount to /app/.wwebjs_auth');
  
  // Verify Health probes
  assert.ok(content.includes('/health/liveness'), 'Liveness probe path must be configured');
  assert.ok(content.includes('/health/readiness'), 'Readiness probe path must be configured');
  
  // Verify Non-root security context
  assert.ok(content.includes('runAsNonRoot: true'), 'Must run as non-root user');
  assert.ok(content.includes('runAsUser: 10001'), 'Must run with specific UID');
  
  // Verify Resources
  assert.ok(content.includes('limits:'), 'Resource limits must be specified');
  assert.ok(content.includes('requests:'), 'Resource requests must be specified');
});

test('Helm templates directory contains all required Kubernetes resources', () => {
  const templatesDir = path.join(chartDir, 'templates');
  const files = fs.readdirSync(templatesDir);
  
  assert.ok(files.includes('deployment.yaml'), 'deployment.yaml must exist');
  assert.ok(files.includes('service.yaml'), 'service.yaml must exist');
  assert.ok(files.includes('pvc.yaml'), 'pvc.yaml must exist');
  assert.ok(files.includes('secret.yaml'), 'secret.yaml must exist');
  assert.ok(files.includes('ingress.yaml'), 'ingress.yaml must exist');
  assert.ok(files.includes('_helpers.tpl'), '_helpers.tpl must exist');
});

test('Helm deployment template mounts auth PVC and exposes health endpoints', () => {
  const deploymentPath = path.join(chartDir, 'templates', 'deployment.yaml');
  const content = fs.readFileSync(deploymentPath, 'utf8');
  assert.ok(content.includes('persistentVolumeClaim'));
  assert.ok(content.includes('auth-storage'));
  assert.ok(content.includes('livenessProbe'));
  assert.ok(content.includes('readinessProbe'));
  assert.ok(content.includes('secretKeyRef'));
});
