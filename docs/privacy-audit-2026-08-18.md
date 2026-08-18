# Loomi published-copy corrections — verified findings

Sixteen corrections survived independent skeptical review across four audits. Two claims were refuted and are excluded (see the closing note). Nothing here has been edited; this is the change list.

**Root cause, stated once:** `privacy.html` carries `Last Updated: March 2026` (`/Users/shahin/Developer/tricycle/project loomi/loomi-landing-page/privacy.html:361`) and was written for an iOS-only, Apple-only, device-local app. It was never revised for the Android app, the Google sign-in provider, Google Play Billing, or the Firestore-backed child profile. The Android app serves this exact document in-app (`/Users/shahin/Developer/tricycle/project loomi/loomi-app-android/app/src/main/java/com/chimp98/loomi/ui/web/LoomiLinks.kt:8` → `https://www.loomi.kids/privacy.html?app=true`), including from the paywall (`ui/paywall/PaywallScreen.kt:440-444`). Every finding below is a symptom of that.

---

## HIGH

### 1. Child's first name is claimed never to leave the device

**Published (false):** `privacy.html:378`
> "**Child's first name** - Used only for personalization within the app (e.g., "Stories for Emma"). This is stored locally on your device and is never transmitted to our servers."

**Code:** `name` is a serialized Firestore field written on create and every edit, both platforms.
- `loomi-app-android/.../data/model/Child.kt:23-28` (`COLLECTION`, `name`)
- `loomi-app-android/.../ui/childsetup/ChildSetupViewModel.kt:164-165` (`batch.set(childRef, child)`)
- `loomi-app-android/.../ui/settings/SettingsViewModel.kt:293-311`, `:313-327` (`"name" to name.trim()`)
- `loomi-app-ios/Loomi/Models/Child.swift:13-17`; `loomi-app-ios/Loomi/App/AppState.swift:549-578`, `:581-598` (`addChildToFirestore` is unconditional at `:429-431`)

**Proposed replacement:**
> **Child's first name** ... used to personalize the app (for example, "Stories for Emma"). It is saved to your Loomi account in our Firebase database so the profile is still there when you reinstall the app or sign in on another device. Security rules mean only your signed-in account can read or change it, and we never show it to anyone else or use it in advertising.

---

### 2. Child's age range is claimed device-only

**Published (false):** `privacy.html:379`
> "**Child's age range** - Used to filter age-appropriate content. Stored locally on your device only."

**Code:** written to Firestore by the same paths as #1 (`Child.kt:27`, `Child.swift:16`, `SettingsViewModel.kt:323`), **and** transmitted to Firebase Analytics as event parameters and as a persistent user property.
- Events: `analytics/AnalyticsEvent.kt:193-196` (`age_range`), `:199-208` (`to_age` / `from_age`), `:211-220` (`child_count`); callers `ui/childsetup/ChildSetupViewModel.kt:122`, `ui/settings/SettingsViewModel.kt:299`, `data/repository/ActiveChildStore.kt:87`
- iOS equivalents `Loomi/Models/AnalyticsEvent.swift:554-567`, `:571-576`, `:586-596`; callers `App/AppState.swift:471-474`, `ViewModels/PlaybackViewModel.swift:371-378`, `Views/Library/StoryDetailView.swift:963-967`
- User property `active_child_age` set on every profile switch: `App/AppState.swift:475`, `:564-567` → `Services/AnalyticsService.swift:84-92` (Android defines it at `analytics/AnalyticsService.kt:76` but currently passes null from `analytics/AppLifecycleTracker.kt:92`)

**Proposed replacement:**
> **Child's age range** ... used to show age-appropriate stories. It is saved to your Loomi account alongside the profile, and the age band on its own (never your child's name) is included in the usage statistics we send to Firebase Analytics so we can see which stories suit which ages.

---

### 3. "Stored exclusively on your device" / "No Cloud Sync of Child Data"

**Published (false):** `privacy.html:402-403`
> "**Local Storage:** Child profile information (name and age) is stored exclusively on your device"
> "**No Cloud Sync of Child Data:** We do not upload or sync children's information to any servers"

**Code:** profiles load from a uid-scoped Firestore snapshot listener, which is cross-device sync by construction.
- `loomi-app-android/.../data/repository/ActiveChildStore.kt:96-139` ("honours a change persisted from another device")
- `loomi-app-ios/Loomi/App/AppState.swift:483-546` (`startChildrenListener`, `.addSnapshotListener`)
- `loomi-app-android/.../data/repository/StoryStateRepository.kt:6-11`, `:169-170`; `data/model/StoryState.kt:80-84` ("a favourite set on one platform must surface on the other")

**Proposed replacement (both bullets):**
> **Cloud storage:** Your child's profile ... first name and age range ... is stored in your Loomi account on Google Firebase, protected by rules that let only your signed-in account read or change it.
> **Syncing across your devices:** Because the profile belongs to your account rather than to one handset, it appears on every device you sign in to and survives reinstalling the app.

---

### 4. Support page states profile data is not synced across devices

**Published (false):** `support.html:454`
> "Profile data is stored on your device. If you signed out, reinstalled the app, or restored from an iCloud backup that pre-dated profile creation, you may need to re-add the profile. We don't sync profile data across devices to protect your child's privacy."

**Code:** contradicted by the listeners in #3; profiles are keyed to the Firebase uid, not the device, so the stated failure mode is also wrong.

**Proposed replacement:**
> Profiles are saved to your Loomi account, not to a single device, so they follow you when you reinstall or switch phones. If a profile is missing, check that you are signed in with the same method you first used ... signing in with Apple and signing in with Google create two separate accounts, each with their own profiles. If it is still missing, email support@loomi.kids and we will help.

---

### 5. Per-child listening history is stored server-side and disclosed nowhere

**Published (the copy that forecloses it):**
- `privacy.html:370` — "We do not collect, use, or share personal information from children."
- `privacy.html:385` — "We do **not** collect children's personal information"
- The full "Information We Collect" list (`:377-380`) and "Data Storage" list (`:401-404`) name only child first name, age range, Apple ID and downloaded audio.

**Code:** a behavioural record is written to `users/{uid}/children/{childId}/storyState/{storyKey}` on every play, pause, favourite and completion.
- Fields `favourite`, `favouritedAt`, `lastNarratorId`, `lastMelodyFileName`, `lastSleepTimerMinutes`, `lastStoryId`, `lastNarrationSeconds`, `lastPlayedAt`, `playCount`, `completedCount`: `data/model/StoryState.kt:23-33`
- Writes: `data/repository/StoryStateRepository.kt:145-165`, `:176-195`, `:204-226`, `:233-239`, `:245-255`; path `:259-262`
- iOS: `Loomi/Services/StoryStateService.swift:195-205`, `:218-233`, `:243-258`, `:264-268`, `:273-279`; path `:289-298`
- Declared in the deployed rules at `loomi-app-ios/firebase/firestore.rules:18`

**Proposed replacement (new bullet in "Information We Collect", plus strike the two absolute denials at `:370` and `:385`):**
> **Listening activity for each profile** ... which stories were started and finished, where playback was paused so it can resume, which narrator, melody and sleep-timer setting were last used, and which stories were marked as favourites. This is kept with your account so a story picks up where it left off on any of your devices. It contains no recordings and no information beyond what happens inside Loomi.

Replace `:370` / `:385` with an accurate framing, for example:
> Loomi does not ask children for information directly and never collects photos, videos, voice recordings or location. The limited information we do hold about a child ... a first name, an age range and their in-app listening activity ... is provided by you, the parent, and stored in your account.

---

### 6. "We do not use analytics that track individual children" is false

**Published (false):**
- `privacy.html:388` — "We do **not** use analytics that track individual children"
- `privacy.html:412` — "**Firebase Analytics** — For anonymised, aggregate usage analytics at the parent-account level only. Firebase Analytics is **never** used to track children or collect children's personal information"
- `privacy.html:414` — "We do not use third-party advertising, analytics that track children, or social media integrations."

**Code:** the child's Firestore document ID (a stable per-child identifier, `data/model/Child.kt:23-25`) is sent to Firebase Analytics on four events, both platforms.
- `analytics/AnalyticsEvent.kt:604-613` (`"child_id"`); callers `ui/settings/SettingsViewModel.kt:315`, `:331` (verified)
- `ui/library/LibraryViewModel.kt:446-451` (`library_filter_changed`, `filterValue = child.id`), `:490-494` + `:516-526` (`"child:${child.id}+age:${child.ageRange}"` attached to `story_card_tapped`)
- iOS: `Models/AnalyticsEvent.swift:738-742`; `Views/Library/LibraryView.swift:43-48`, `:409-413`, `:503-507`; `Views/Settings/EditChildView.swift:205`, `:230-232`
- Sticky user properties `active_child_age` / `child_count`: `Services/AnalyticsService.swift:84-92`, set at `App/AppState.swift:475`, `:564-567`
- No consent gate: `analytics/AnalyticsService.kt:42-49`; iOS's only guard is `PreviewDetector.isPreview` (`Services/AnalyticsService.swift:33`, `:52`)

**Proposed replacement (delete the `:388` bullet; rewrite `:412`; keep `:414`'s advertising half):**
> **Firebase Analytics (Google)** ... for usage statistics that show us how the app is being used. Some events include a random profile code and the age range of the profile in use, so we can tell whether, say, a bedtime story works better for a three-year-old than a five-year-old. Your child's name is never sent. None of this data is used for advertising, sold, or shared for marketing.

And at `:414`:
> We do not use third-party advertising or social media integrations, and we do not track anyone across other apps or websites.

---

### 7. Subscription events are claimed never linked to children's information

**Published (false):** `privacy.html:430`
> "…These events help us understand how parents interact with our subscription offering and are **never** linked to children's personal information."

**Code:** iOS sets `active_child_age` and `child_count` as Firebase **user properties** (`App/AppState.swift:475`, `:564-566` → `Services/AnalyticsService.swift:85`, `:92`), which Firebase attaches to every subsequent event from that install, including `subscription_started` logged through the same `Analytics` object (`Services/SubscriptionService.swift:308-311`, `Services/AnalyticsService.swift:60`). The policy itself classifies child age as child profile data at `:402`.

**Proposed replacement:**
> These events go through Firebase Analytics and carry no names, email addresses or payment details. Like our other usage statistics, they are recorded against the app installation, which also carries the age range of the profile in use and how many profiles are on the account.

---

### 8. Google Sign-In, Google Play Billing, Crashlytics and Argus are all absent from a list written as complete

**Published (incomplete):** `privacy.html:408-413`
> "Loomi uses the following third-party services:" · "**Apple Sign-In** — For secure authentication" · "**Apple App Store** — For processing purchases and subscriptions" · "**Firebase Analytics** — …"

The strings *Google*, *Android*, *Google Play* and *Crashlytics* appear **nowhere** in `privacy.html`, `terms.html`, `support.html` or `index.html` (only `fonts.googleapis.com` and the GA tag in `<head>`).

**Code:**
- **Google Sign-In**, ungated on both platforms: `ui/auth/SignInScreen.kt:69`, `:151-153`; `ui/auth/SignInViewModel.kt:64`; `auth/GoogleCredentialService.kt:62-74`; iOS `Views/Auth/SignInView.swift:95`; `Services/AuthService.swift:177-188`
- **Google Play Billing**: `billing/PlayBillingService.kt:51-58`, `:242-254`, `:311-328`, `:350-361`; `billing/EntitlementResolver.kt:79`
- **Firebase Crashlytics**, compiled in and auto-collecting with no opt-out: `app/build.gradle.kts:11`, `:183`; root `build.gradle.kts:242`; iOS `Loomi/App/LoomiApp.swift:14`, `:28`; SPM product + dSYM phase `Loomi.xcodeproj/project.pbxproj:804-807`, `:365-387`. No `FirebaseCrashlyticsCollectionEnabled` in `Loomi/Info.plist`, no `firebase_crashlytics_collection_enabled` in `app/src/main/AndroidManifest.xml`
- **Argus** (feature flags, separate Cloud Functions project) receiving the Firebase uid or a persisted install UUID: `di/FlagsModule.kt:36`, `:59-63`, `:77`; `flags/ArgusInstallIdentity.kt:27-37`; iOS `Managers/Argus/FeatureFlagManager.swift:190`, `:224`, `:233`
- The list also omits the other Firebase services in use ... Auth, Firestore, Storage, Messaging, Remote Config.

**Proposed replacement (whole list):**
> Loomi uses the following outside services:
> - **Sign in with Apple** and **Sign in with Google** ... so you can create an account without a password.
> - **Apple App Store** (iPhone) and **Google Play** (Android) ... to process subscriptions. They handle the payment; we never see your card details.
> - **Google Firebase** ... Authentication, Firestore, Cloud Storage, Cloud Messaging, Remote Config and Analytics. This is where your account, your child's profiles and their listening activity are stored, and where our usage statistics go.
> - **Firebase Crashlytics** (Google) ... to receive automatic crash reports when the app stops unexpectedly. These include the device model, operating-system version and a technical crash trace, plus a random installation code. They contain no names and no profile information.
> - **Argus** ... our own feature-flag service, which tells the app which features to turn on. It receives your account identifier, or a random per-install code if you are signed out, so that a feature can be switched on consistently for you.

---

### 9. Every purchase statement is Apple-only, on an app that also ships on Google Play

**Published (false for Android users):**
- `privacy.html:411` — "**Apple App Store** — For processing purchases and subscriptions"
- `privacy.html:420` — "This status is checked through Apple's StoreKit framework…"
- `privacy.html:425` — "All payment processing is handled entirely by Apple through the App Store."
- `terms.html:445` — "Payment will be charged to your Apple ID account at confirmation of purchase"
- `terms.html:454` — "Refund requests must be directed to Apple, as they process all payments."
- `support.html:419` — "Subscriptions are managed entirely through the App Store."
- `support.html:433` — "Sign in to the new device with the same Apple ID, install Loomi, then open **Settings → Restore Purchases**…"

**Code:** Android has no StoreKit path; entitlement comes from Play (`billing/PlayBillingService.kt:51-58`, `:230`, `:242-254`; `billing/EntitlementResolver.kt:79`), and this page is what the Android paywall links to (`ui/web/LoomiLinks.kt:8` ← `ui/paywall/PaywallScreen.kt:440-444`, `ui/settings/SettingsScreen.kt:277-278`).

**Proposed replacements:**
- `privacy.html:425`: "Payments are handled entirely by the app store you bought through ... Apple's App Store on iPhone, or Google Play on Android. Loomi does **not** collect, store or have access to card numbers, billing addresses or any other payment details."
- `terms.html:445`: "Payment is charged to your App Store account on iPhone, or your Google Play account on Android, when you confirm the purchase."
- `terms.html:454`: "Refunds are handled by the store that processed your payment ... Apple for App Store purchases, Google for Google Play purchases. We do not have access to your payment information."
- `support.html:419`: "Subscriptions are managed through the App Store on iPhone and through Google Play on Android. Loomi does not store payment information."
- `support.html:433`: "Sign in to the new device with the same App Store or Google Play account, install Loomi, then open **Settings → Restore Purchases** in the app. On Android your subscription is restored automatically once you sign in to Google Play."

---

### 10. "Entitlement status is not transmitted to our servers" is false

**Published (false):** `privacy.html:420`
> "We store your subscription entitlement status (active, expired, or in a free trial) locally on your device to determine which content you can access. This status is checked through Apple's StoreKit framework and is **not** transmitted to our servers."

**Code:** the resolved entitlement is sent to Loomi's own Firebase project as the `is_user_subscribed` parameter every time a premium story card is tapped, unconditionally on both platforms.
- iOS `Views/Library/LibraryView.swift:412-420` → `Models/AnalyticsEvent.swift:717-722`
- Android `ui/library/LibraryScreen.kt:284` → `ui/library/LibraryViewModel.kt:615-624` → `analytics/AnalyticsEvent.kt:577-584`
- Delivery `analytics/AnalyticsService.kt:48`, `Loomi/Services/AnalyticsService.swift:60`
- Not covered by the "Subscription Analytics" list at `:433-437`, which does not include `premium_story_tapped`

**Proposed replacement:**
> We keep your subscription status ... active, expired, or in a free trial ... on your device to decide which stories you can play. It comes from the App Store on iPhone and from Google Play on Android, and we never receive your payment details. A simple yes/no of whether an account is subscribed is included in some usage events, such as tapping a premium story, so we can see how the free and paid experience compares.

---

### 11. On iOS, a Google-signed-in parent cannot complete account deletion ... and their data is wiped before the failure

**Published (false for that population):** `privacy.html:465-466`, `support.html:438`, `terms.html:469`
> "You may delete your account at any time through the app settings or by contacting us" · "Upon account deletion, all associated data is permanently removed" · "Inside the app, open **Settings → Account → Delete Account**. This permanently removes your account and all associated data." · "You may delete your account at any time through the App settings."

**Code:** the iOS flow is Apple-only, with no provider branch and no gate.
- `Views/Settings/DeleteAccountView.swift:103-118` ... the sole confirmation control is `SignInWithAppleButton`
- `Services/AuthService.swift:281`, `:286-288` ... hard guard on `ASAuthorizationAppleIDCredential`, else `AuthError.invalidCredential`; `:311` re-auth throws `userMismatch` for a Google-provisioned user
- `Views/Settings/SettingsView.swift:467-497` ... shown to every user; zero `providerID` / `google.com` hits in either file
- `Views/Settings/DeleteAccountView.swift:187-206` ... `wipeUserDataForAccountDeletion()` at `:193` runs **before** the re-auth at `:197`, so `App/AppState.swift:267-290` destroys children, story state, the user doc and offline audio, then the Apple re-auth fails and the Auth record (holding the Google email, display name and photo URL) survives
- Android is correct here: `auth/AuthService.kt:380-418`, Google re-auth at `:401-405`

**The correction is a code fix, not a copy change.** Add a provider branch to the iOS delete flow and move the wipe to *after* successful re-authentication. Until that ships, the published copy is false and the interim honest wording is:

> You can delete your account from **Settings → Account → Delete Account** in the app. On iPhone this currently requires confirming with Apple, so if you signed in with Google, email privacy@loomi.kids and we will delete your account for you within 7 days.

Do not ship that as the permanent wording ... it documents a defect.

---

### 12. On Android, deletion orphans every child's `storyState` sub-collection

**Published (false):** `privacy.html:466`
> "Upon account deletion, all associated data is permanently removed"

**Code:** the Android batch deletes `children`, `settings` and the user doc only ... `ui/settings/SettingsViewModel.kt:407-420`. Per-child listening history lives one level deeper at `users/{uid}/children/{childId}/storyState/{key}` (`data/repository/StoryStateRepository.kt:259-262`) and Firestore does not cascade. No `deleteStoryState` / `deleteAll` / `purge` exists in the Android source, and `loomi-app-ios/firebase/firebase.json` declares only `firestore` and `storage` ... there is no Cloud Function to clean up. iOS handles it and names the hazard: `App/AppState.swift:357-362` ("Firestore does NOT cascade into subcollections… listening history under Guideline 5.1.1(v)").

**The correction is a code fix.** Port the iOS `deleteStoryState(under:)` recursion into `SettingsViewModel.deleteAccount`. No copy change is appropriate ... the sentence at `:466` should be made true rather than softened.

---

### 13. The sign-in disclosure understates what is collected, and names only Apple

**Published (incomplete):** `privacy.html:380`
> "**Apple ID authentication** - If you sign in with Apple, we receive only the minimum information necessary to create your account (a unique identifier and, optionally, your email address if you choose to share it)."

**Code:** both apps request the full-name scope and persist the result to the Firebase Auth profile; the Google path additionally supplies the real account email with no relay option, plus a photo URL held on the Auth record.
- iOS `Services/AuthService.swift:65` (`requestedScopes = [.fullName, .email]`), `:121-132` (`createProfileChangeRequest()` commits the assembled display name), `:215-216` (reads `displayName`, `email` on the Google path)
- Android `auth/AppleCredentialService.kt:57-58` (`scopes = listOf("email", "name")`), `auth/AuthService.kt:180-183` (`displayName`, `email`, `photoUrl`), `:446`

**Proposed replacement:**
> **Signing in** ... you can sign in with Apple or with Google. From Apple we receive a unique identifier, your name if you choose to share it, and your email address unless you choose Apple's Hide My Email option. From Google we receive your name, your Google account email address and a link to your profile picture. This sits on your Loomi account record so we can identify you when you sign back in, and it is not shared with anyone or used for marketing.

---

## MEDIUM

### 14. Survey responses keyed to your account survive account deletion

**Published (false):** `privacy.html:466`
> "Upon account deletion, all associated data is permanently removed"

**Code:** survey responses go to a **top-level** collection stamped with the uid, which neither deletion flow touches.
- `data/model/Survey.kt:55` (`COLLECTION = "surveys"`), `data/repository/SurveyRepository.kt:109-129` (`surveys/{surveyId}/responses/{responseId}`), `:230` (`put("user_id", response.userId)`); iOS `Services/SurveyService.swift:101`
- Deletion covers only children/settings/user doc: `ui/settings/SettingsViewModel.kt:407-420`, `App/AppState.swift:267-290`
- `loomi-app-ios/firebase/firestore.rules:115-118` gates access on `resource.data.user_id == request.auth.uid`, so no client can ever reach these once the uid is gone. (Operator deletion via the admin SDK or console still works ... the record is unreachable, not literally undeletable.)

**Correction:** either include the survey responses in both deletion flows, or disclose the retention honestly. If retention is the deliberate choice:

> **When you delete your account:** we permanently remove your account record, your children's profiles and their listening activity. Answers you gave to in-app surveys are kept in a separate research record that is no longer connected to your account and can no longer identify you.

That wording is only accurate if the `user_id` field is stripped or hashed at deletion time. Today it is not, so the code change is the honest fix.

---

### 15. The Security section describes protection that does not match where the data lives

**Published (misleading):** `privacy.html:471`
> "We implement industry-standard security measures to protect any information we handle. Child profile data stored locally on your device is protected by your device's built-in security features."

**Code:** the actual safeguard for both the profile and the per-child story state is an owner-only Firestore rule on a cloud database ... `loomi-app-ios/firebase/firestore.rules:11`, `:18`. This is the section a regulator reads for the safeguards representation, and it restates the false locality premise.

**Proposed replacement:**
> We use industry-standard security to protect the information we hold. Your account, your children's profiles and their listening activity are stored on Google Firebase, encrypted in transit and at rest, behind rules that allow only your own signed-in account to read or change them. Story audio downloaded for offline playback stays on your device and is protected by your device's built-in security.

---

### 16. Housekeeping ... the "Last Updated" date

`privacy.html:361` reads "**Last Updated:** March 2026". Once the above lands it must be bumped, and the same pass should confirm the Play **Data safety** declaration matches the revised policy ... the Crashlytics and Google Play disclosures in #8 and #9 are declarable items there, and a mismatch is a Families-policy review flag on its own.

---

## Excluded ... refuted on review, no change required

- **"Entitlement can be granted by a remote whitelist"** as a *subscription* disclosure gap. The Argus premium whitelist is real and ungated (`Loomi/Services/SubscriptionService.swift:118` ahead of StoreKit at `:134`; `billing/EntitlementResolver.kt:78-79`), but it transmits nothing extra ... the uid reaches Argus for every user on every flag fetch regardless. The only genuine gap is Argus's absence from the third-party list, which is folded into correction #8. A privacy policy is not obliged to enumerate internal premium-grant tiers.
- **"We do not use cookies or similar tracking technologies"** (`privacy.html:389`). True under the ordinary reading of cross-context behavioural tracking, which Loomi demonstrably does not do: `app/src/main/AndroidManifest.xml:28-34` strips both AD_ID permissions, `:72-77` disables adid collection and ad-personalization signals, and neither codebase calls `setUserId` / `setUserID`. First-party functional identifiers are not "similar tracking technologies". Leave the sentence as written.