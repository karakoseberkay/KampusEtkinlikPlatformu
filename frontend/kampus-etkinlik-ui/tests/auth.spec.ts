/// <reference types="node" />

import { expect, test } from '@playwright/test';

const API_BASE_URL =
  process.env.API_BASE_URL ??
  'https://campusbody-api.onrender.com/api';

const studentEmail = process.env.TEST_STUDENT_EMAIL;
const studentPassword = process.env.TEST_STUDENT_PASSWORD;

const managerEmail = process.env.TEST_MANAGER_EMAIL;
const managerPassword = process.env.TEST_MANAGER_PASSWORD;

type AuthResponse = {
  userId: string;
  fullName: string;
  email: string;
  roles: string[];
  accessToken: string;
  expiresAtUtc: string;
};

test.beforeAll(() => {
  if (
    !studentEmail ||
    !studentPassword ||
    !managerEmail ||
    !managerPassword
  ) {
    throw new Error(
      'TEST_STUDENT_EMAIL TEST_STUDENT_PASSWORD TEST_MANAGER_EMAIL ve TEST_MANAGER_PASSWORD tanımlanmalı'
    );
  }
});

test('student can login and receives jwt', async ({ request }) => {
  const response = await request.post(
    `${API_BASE_URL}/Auth/login`,
    {
      data: {
        email: studentEmail,
        password: studentPassword
      }
    }
  );

  expect(response.status()).toBe(200);

  const body = await response.json() as AuthResponse;

  expect(body.userId).toBeTruthy();

  expect(body.email.toLowerCase()).toBe(
    studentEmail!.toLowerCase()
  );

  expect(body.roles).toContain('Student');

  expect(body.accessToken).toBeTruthy();

  expect(body.expiresAtUtc).toBeTruthy();
});

test('club manager can login and receives manager role', async ({ request }) => {
  const response = await request.post(
    `${API_BASE_URL}/Auth/login`,
    {
      data: {
        email: managerEmail,
        password: managerPassword
      }
    }
  );

  expect(response.status()).toBe(200);

  const body = await response.json() as AuthResponse;

  expect(body.userId).toBeTruthy();

  expect(body.email.toLowerCase()).toBe(
    managerEmail!.toLowerCase()
  );

  expect(body.roles).toContain('ClubManager');

  expect(body.accessToken).toBeTruthy();
});

test('wrong password is rejected', async ({ request }) => {
  const response = await request.post(
    `${API_BASE_URL}/Auth/login`,
    {
      data: {
        email: studentEmail,
        password: 'DefinitelyWrongPassword123'
      }
    }
  );

  expect(response.status()).toBe(401);

  const body = await response.json();

  expect(body.message).toBe(
    'Incorrect email or password.'
  );
});

test('unknown user is rejected without revealing account existence', async ({ request }) => {
  const response = await request.post(
    `${API_BASE_URL}/Auth/login`,
    {
      data: {
        email: 'does-not-exist-campusbody@example.com',
        password: 'DefinitelyWrongPassword123'
      }
    }
  );

  expect(response.status()).toBe(401);

  const body = await response.json();

  expect(body.message).toBe(
    'Incorrect email or password.'
  );
});

test('student jwt works on auth me endpoint', async ({ request }) => {
  const loginResponse = await request.post(
    `${API_BASE_URL}/Auth/login`,
    {
      data: {
        email: studentEmail,
        password: studentPassword
      }
    }
  );

  expect(loginResponse.status()).toBe(200);

  const login = await loginResponse.json() as AuthResponse;

  const meResponse = await request.get(
    `${API_BASE_URL}/Auth/me`,
    {
      headers: {
        Authorization: `Bearer ${login.accessToken}`
      }
    }
  );

  expect(meResponse.status()).toBe(200);

  const me = await meResponse.json() as AuthResponse;

  expect(me.userId).toBe(login.userId);

  expect(me.email).toBe(login.email);

  expect(me.roles).toContain('Student');
});

test('request without jwt cannot access auth me', async ({ request }) => {
  const response = await request.get(
    `${API_BASE_URL}/Auth/me`
  );

  expect(response.status()).toBe(401);
});

test('student cannot create an event', async ({ request }) => {
  const loginResponse = await request.post(
    `${API_BASE_URL}/Auth/login`,
    {
      data: {
        email: studentEmail,
        password: studentPassword
      }
    }
  );

  const login = await loginResponse.json() as AuthResponse;

  const response = await request.post(
    `${API_BASE_URL}/Events`,
    {
      headers: {
        Authorization: `Bearer ${login.accessToken}`
      },
      data: {}
    }
  );

  expect(response.status()).toBe(403);
});

test('club manager passes event role authorization', async ({ request }) => {
  const loginResponse = await request.post(
    `${API_BASE_URL}/Auth/login`,
    {
      data: {
        email: managerEmail,
        password: managerPassword
      }
    }
  );

  const login = await loginResponse.json() as AuthResponse;

  const response = await request.post(
    `${API_BASE_URL}/Events`,
    {
      headers: {
        Authorization: `Bearer ${login.accessToken}`
      },
      data: {}
    }
  );

  expect(response.status()).not.toBe(401);
  expect(response.status()).not.toBe(403);

  // boş request gönderdiğimiz için etkinlik oluşturulmaması gerekiyor
  expect(response.status()).toBeGreaterThanOrEqual(400);
});