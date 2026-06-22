/**
 * js/api.js
 * ---------------------------------------------------------------------------
 * Satu-satunya file yang tahu cara berbicara dengan backend (Google Apps
 * Script). Semua halaman lain memanggil callApi(...), tidak pernah fetch()
 * langsung — supaya kalau ada perubahan cara komunikasi (mis. ganti URL,
 * tambah header), cukup diubah di satu tempat ini.
 * ---------------------------------------------------------------------------
 */

// GANTI dengan URL Web App Anda dari Apps Script (diakhiri "/exec").
// Lihat docs/03-DEPLOYMENT-GUIDE.md Bagian A langkah 9.
const API_BASE_URL = "https://script.google.com/macros/s/AKfycbwPg8phJOgtl6yIBOsfCsjYjuzpfIABnnCJChwgjcLSb9LJZJJkusrco0MGGVU3Rs297w/exec";

// OPSIONAL: isi dengan Google OAuth Client ID Anda untuk mengaktifkan tombol
// "Masuk dengan Google" di index.html. Kosongkan ("") untuk menyembunyikan
// tombol tersebut sepenuhnya — login email/password tetap berfungsi normal
// tanpa ini. Lihat docs/03-DEPLOYMENT-GUIDE.md bagian "Login dengan Google
// (opsional)" untuk cara membuat Client ID di Google Cloud Console.
const GOOGLE_OAUTH_CLIENT_ID = "";

/**
 * Memanggil satu action di backend.
 * @param {string} action - nama action, lihat backend/Code.gs -> getActionMap_()
 * @param {object} payload - data yang dikirim untuk action tersebut
 * @returns {Promise<any>} data hasil (bagian `data` dari respons backend)
 * @throws {Error} jika backend mengembalikan ok:false, atau request gagal
 */
async function callApi(action, payload = {}) {
  if (API_BASE_URL.indexOf("TEMPEL_URL_WEB_APP") !== -1) {
    throw new Error("API_BASE_URL belum diisi. Edit js/api.js dulu.");
  }

  const response = await fetch(API_BASE_URL, {
    method: "POST",
    // PENTING: text/plain, BUKAN application/json — supaya browser tidak
    // mengirim preflight OPTIONS yang tidak bisa dijawab Apps Script.
    // Lihat catatan CORS di backend/Code.gs.
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, payload })
  });

  if (!response.ok) {
    throw new Error("Gagal menghubungi server (HTTP " + response.status + ").");
  }

  const result = await response.json();
  if (!result.ok) {
    throw new Error(result.error || "Terjadi kesalahan yang tidak diketahui.");
  }
  return result.data;
}

// ============================================================================
// SESSION HELPER — token disimpan di localStorage browser (aman dilakukan di
// sini karena ini benar-benar situs statis terpisah, bukan Claude Artifact).
// ============================================================================

const SESSION_KEY = "eai_session_token";
const USER_KEY = "eai_user";

function saveSession(sessionToken, user) {
  localStorage.setItem(SESSION_KEY, sessionToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getSessionToken() {
  return localStorage.getItem(SESSION_KEY);
}

function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Dipanggil di awal setiap halaman yang butuh login (dashboard, quiz, dst).
 * Mengarahkan ke index.html kalau belum login.
 */
async function requireLogin() {
  const token = getSessionToken();
  if (!token) {
    window.location.href = "index.html";
    return null;
  }
  try {
    const { user } = await callApi("checkSession", { token });
    return user;
  } catch (err) {
    clearSession();
    window.location.href = "index.html";
    return null;
  }
}
