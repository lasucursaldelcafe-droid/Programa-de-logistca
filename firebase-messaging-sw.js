/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "demo-api-key",
  authDomain: "demo-personal-eventos.firebaseapp.com",
  projectId: "demo-personal-eventos",
  storageBucket: "demo-personal-eventos.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:demo",
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
