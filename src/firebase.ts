// "whiskerweb/firebase": Firebase app/auth/functions wrapper and the Firebase analytics module.
// Needs the optional peer dependency "firebase"; kept out of the main entry point so it is only bundled when imported.
export * from "./engine/FirebaseSingleton";
export * from "./engine/Analytics/FirebaseAnalytics";
export { FirebaseFeatures } from "./engine/Types/FirebaseFeatures";
