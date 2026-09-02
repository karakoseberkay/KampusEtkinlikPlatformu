/// <reference types="node" />

import { expect, test } from '@playwright/test';

const API_BASE_URL =
  process.env.API_BASE_URL ??
  'https://campusbody-api.onrender.com/api';

test('production frontend opens successfully', async ({ page }) => {
  const pageErrors: string[] = [];

  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  const response = await page.goto('/', {
    waitUntil: 'domcontentloaded'
  });

  expect(response).not.toBeNull();

  expect(response!.status()).toBeLessThan(400);

  await expect(page.locator('body')).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test('popular events endpoint works without login', async ({ request }) => {
  const response = await request.get(
    `${API_BASE_URL}/Events/popular?limit=10`
  );

  expect(response.status()).toBe(200);

  const events = await response.json();

  expect(Array.isArray(events)).toBeTruthy();

  expect(events.length).toBeGreaterThan(0);
});

test('protected events endpoint rejects anonymous user', async ({ request }) => {
  const response = await request.get(
    `${API_BASE_URL}/Events`
  );

  expect(response.status()).toBe(401);
});

test('vercel frontend can reach render api from browser', async ({ page }) => {
  await page.goto('/', {
    waitUntil: 'domcontentloaded'
  });

  const result = await page.evaluate(async apiUrl => {
    try {
      const response = await fetch(apiUrl);

      const data = await response.json();

      return {
        status: response.status,
        ok: response.ok,
        count: Array.isArray(data) ? data.length : 0,
        error: null
      };
    } catch (error) {
      return {
        status: 0,
        ok: false,
        count: 0,
        error: String(error)
      };
    }
  }, `${API_BASE_URL}/Events/popular?limit=10`);

  expect(result.error).toBeNull();

  expect(result.status).toBe(200);

  expect(result.ok).toBeTruthy();

  expect(result.count).toBeGreaterThan(0);
});