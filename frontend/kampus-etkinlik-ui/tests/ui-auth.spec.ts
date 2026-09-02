/// <reference types="node" />

import { expect, Page, test } from '@playwright/test';

const studentEmail = process.env.TEST_STUDENT_EMAIL;
const studentPassword = process.env.TEST_STUDENT_PASSWORD;

const managerEmail = process.env.TEST_MANAGER_EMAIL;
const managerPassword = process.env.TEST_MANAGER_PASSWORD;


// test hesaplarının terminalde tanımlı olup olmadığını kontrol eder
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


// login sayfasını açıp formun gerçekten geldiğini kontrol eder
async function openLoginPage(page: Page): Promise<void> {
  await page.goto('/', {
    waitUntil: 'domcontentloaded'
  });

  await expect(page).toHaveURL(/\/login/);

  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
}


// gerçek login formunu kullanarak giriş yapar
async function loginFromUi(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await openLoginPage(page);

  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);

  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/\/home/, {
    timeout: 120_000
  });
}


// localstorageda geçerli auth sessionı var mı kontrol eder
async function hasStoredSession(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    return Object.values(localStorage).some(value => {
      try {
        const parsed = JSON.parse(value);

        return (
          typeof parsed?.accessToken === 'string' &&
          parsed.accessToken.length > 0 &&
          Array.isArray(parsed?.roles)
        );
      } catch {
        return false;
      }
    });
  });
}


// localstoragedaki sessionın belirli bir role sahip olup olmadığını kontrol eder
async function storedSessionHasRole(
  page: Page,
  role: string
): Promise<boolean> {
  return page.evaluate(expectedRole => {
    return Object.values(localStorage).some(value => {
      try {
        const parsed = JSON.parse(value);

        return (
          Array.isArray(parsed?.roles) &&
          parsed.roles.includes(expectedRole)
        );
      } catch {
        return false;
      }
    });
  }, role);
}


test('vercel direct login route works', async ({ page }) => {
  const response = await page.goto('/login', {
    waitUntil: 'domcontentloaded'
  });

  expect(response).not.toBeNull();
  expect(response!.status()).toBeLessThan(400);

  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();
});


test('wrong password shows login error in real ui', async ({ page }) => {
  await openLoginPage(page);

  await page.locator('#email').fill(studentEmail!);

  await page.locator('#password').fill(
    'DefinitelyWrongPassword123'
  );

  await page.locator('button[type="submit"]').click();

  await expect(
    page.locator('[role="alert"]')
  ).toContainText('Incorrect email or password.');

  await expect(page).toHaveURL(/\/login/);

  expect(
    await hasStoredSession(page)
  ).toBeFalsy();
});


test('student can login through angular ui', async ({ page }) => {
  const pageErrors: string[] = [];

  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  await loginFromUi(
    page,
    studentEmail!,
    studentPassword!
  );

  expect(
    await hasStoredSession(page)
  ).toBeTruthy();

  expect(
    await storedSessionHasRole(page, 'Student')
  ).toBeTruthy();

  expect(pageErrors).toEqual([]);
});


test('student can open my registrations', async ({ page }) => {
  await loginFromUi(
    page,
    studentEmail!,
    studentPassword!
  );

  const response = await page.goto('/my-registrations', {
    waitUntil: 'domcontentloaded'
  });

  expect(response).not.toBeNull();
  expect(response!.status()).toBeLessThan(400);

  await expect(page).toHaveURL(/\/my-registrations/);
});


test('student cannot open event manage page', async ({ page }) => {
  await loginFromUi(
    page,
    studentEmail!,
    studentPassword!
  );

  await page.goto('/event-manage', {
    waitUntil: 'domcontentloaded'
  });

  await expect(page).not.toHaveURL(/\/event-manage/);
});


test('club manager can login through angular ui', async ({ page }) => {
  const pageErrors: string[] = [];

  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  await loginFromUi(
    page,
    managerEmail!,
    managerPassword!
  );

  expect(
    await hasStoredSession(page)
  ).toBeTruthy();

  expect(
    await storedSessionHasRole(page, 'ClubManager')
  ).toBeTruthy();

  expect(pageErrors).toEqual([]);
});


test('club manager can open event manage page', async ({ page }) => {
  await loginFromUi(
    page,
    managerEmail!,
    managerPassword!
  );

  const response = await page.goto('/event-manage', {
    waitUntil: 'domcontentloaded'
  });

  expect(response).not.toBeNull();
  expect(response!.status()).toBeLessThan(400);

  await expect(page).toHaveURL(/\/event-manage/);

  await expect(
    page.locator('#title')
  ).toBeVisible();
});


test('club manager cannot open student registrations page', async ({ page }) => {
  await loginFromUi(
    page,
    managerEmail!,
    managerPassword!
  );

  await page.goto('/my-registrations', {
    waitUntil: 'domcontentloaded'
  });

  await expect(page).not.toHaveURL(/\/my-registrations/);
});


test('authenticated user cannot return to login page', async ({ page }) => {
  await loginFromUi(
    page,
    studentEmail!,
    studentPassword!
  );

  await page.goto('/login', {
    waitUntil: 'domcontentloaded'
  });

  await expect(page).not.toHaveURL(/\/login$/);
});