importScripts(
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
)
importScripts(
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js',
)

firebase.initializeApp({
  apiKey: 'AIzaSyCUcFAPQy2hSaYRARjhMJh3mTgWHrLrBVs',
  authDomain: 'siru-res-pos.firebaseapp.com',
  projectId: 'siru-res-pos',
  storageBucket: 'siru-res-pos.appspot.com',
  messagingSenderId: '991358067025',
  appId: '1:991358067025:web:3322a81ff7b4fe22353370',
  measurementId: 'G-86JQ48M15L',
})

const messaging = firebase.messaging()

// messaging.onBackgroundMessage(function (payload) {
//   return self.registration.showNotification(payload.data.title, {
//     body: payload.data.body,
//     icon: '/CakeCafeLogo.png',
//     badge: '/CakeCafeBadgeWhite.png',
//   })
// })

// self.addEventListener('notificationclick', function (event) {
//   event.notification.close()
//   event.waitUntil(
//     clients.openWindow(
//       self.location.origin + '/home/notifications/orderNotification',
//     ),
//   )
// })
