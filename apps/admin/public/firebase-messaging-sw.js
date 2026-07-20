/* eslint-disable no-undef */
/* Generado por scripts/update-fcm-sw.ts — no editar a mano */
importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAyjhGqnXqB9SPszb3BsOlQBDvs44gLKzo",
  authDomain: "programalog-ccc12.firebaseapp.com",
  projectId: "programalog-ccc12",
  storageBucket: "programalog-ccc12.firebasestorage.app",
  messagingSenderId: "617377686574",
  appId: "1:617377686574:web:f783b32f31d29e6f1e6bbf",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "Personal Eventos";
  const options = {
    body: payload.notification?.body ?? "",
    icon: "/favicon.ico",
  };
  self.registration.showNotification(title, options);
});
