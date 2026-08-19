# Loomi website — definitive change list

Compiled from four independent audits, each already challenged by a skeptic. **Only findings the skeptic upheld appear below.** Everything the skeptics knocked down is listed at the end so you can see it was considered.

Scope: `/Users/shahin/Developer/tricycle/project loomi/loomi-landing-page/`. Ground truth cross-checked against `loomi-app-ios/Loomi/` and `loomi-app-android/app/src/main/java/com/chimp98/loomi/`.

Within each page, findings are ordered: **(A)** becomes false the day Android ships → **(B)** stale product claims that are wrong today → **(C)** everything else.

Six items need a product decision, not a wording change. They are marked **DECISION** and the question is posed inline. All six are collected in a summary at the bottom.

---

## 1. `install.html` (155 lines)

### 1.1 — (A) The page hard-redirects every visitor, Android included, to the Apple App Store

**Verbatim, `install.html:34`:**
```js
var APP_STORE_URL = "https://apps.apple.com/app/loomi-sleep-stories-for-kids/id6757821754";
```
**`install.html:40-43` and `:51-53`:**
```js
var m = document.createElement("meta");
m.httpEquiv = "refresh";
m.content = "1; url=" + APP_STORE_URL;
document.head.appendChild(m);
...
setTimeout(function () {
    window.location.replace(APP_STORE_URL);
}, 800);
```
**`install.html:141-147`:**
```html
<h1>Loomi is on the App Store</h1>
<p>Taking you there now...</p>
<a class="app-store-link" href="https://apps.apple.com/app/...">
    <img src="./assets/app-store-badge.svg" alt="Download on the App Store">
</a>
<p class="redirect-note">
    Not redirecting? <a href="https://apps.apple.com/app/...">Tap here to install Loomi.</a>
</p>
```

**Why it is wrong:** there is no user-agent branch anywhere in the file. An Android parent who opens `loomi.kids/install` from a QR code, flyer, or shared link is redirected inside 800 ms to an `apps.apple.com` page with no install path. The meta-refresh means it fires with JS disabled too.

**Severity note (from the skeptic):** nothing on the site currently links to `/install` — a grep across all HTML/JS/MD finds no inbound reference, and `README.md:33` describes it as catching *old TestFlight install links*. So this is a loaded gun rather than a live bleed. It still must be fixed before the URL is handed out at Android launch.

**Replacement:**
```js
var APP_STORE_URL  = "https://apps.apple.com/app/loomi-sleep-stories-for-kids/id6757821754";
var PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.chimp98.loomi";
var ua = navigator.userAgent || "";
var target = /android/i.test(ua) ? PLAY_STORE_URL
           : /iPhone|iPad|iPod/i.test(ua) ? APP_STORE_URL
           : null;   // desktop ... show both badges, redirect nowhere
```
Copy:
- `<h1>` → **Get Loomi**
- `<p>` → **Taking you to your app store now...**
- Manual fallback → **Not redirecting? Get Loomi on the App Store or on Google Play**, with both badges.

**DECISION:** `https://play.google.com/store/apps/details?id=com.chimp98.loomi` returns **404 today** — the listing is not live. The package id is confirmed from `loomi-app-android/CLAUDE.md`. *Question: do we ship the branch now with the Play URL pre-wired (dead until the listing goes live), or hold the change until the listing is published?* Shipping it early is safe only if the listing goes live before the site does.

### 1.2 — (C) The `<noscript>` block describes a fallback that does not exist

**Verbatim, `install.html:151-153`:**
```html
<noscript>
    <!-- Without JS, the meta refresh above will redirect after 1 second. -->
</noscript>
```

**Why it is wrong:** there is no meta refresh "above" in the markup. It is created *by JavaScript* at `:40-43`. With JS off, nothing redirects. The comment is false and the next person to touch this file will trust it.

**Impact is small** — a no-JS visitor still gets the working manual badge at `:143-147`, so the page is not broken, only the comment is a lie.

**Replacement:** delete the misleading comment and put a real static fallback in, pointed at a neutral page once the platform branch above lands (a `<noscript>` cannot branch on user agent):
```html
<noscript>
    <p>JavaScript is off ... use the buttons above to install Loomi.</p>
</noscript>
```

---

## 2. `index.html` (3,679 lines)

### 2.1 — (A) The App Store badge is the only call to action, in all three places

**Verbatim, `index.html:1894` (header), `:1921` (hero CTA), `:2666` (final CTA)** — identical markup at each:
```html
<a href="https://apps.apple.com/app/loomi-sleep-stories-for-kids/id6757821754" class="app-store-badge" aria-label="Download Loomi on the App Store">
    <img src="./assets/app-store-badge.svg" alt="Download on the App Store">
</a>
```

**Why it is wrong:** the strings "Google Play" and `play.google.com` appear **zero** times in the file (the only two "android" hits are `android-chrome-*.png` favicon filenames). `assets/` contains `app-store-badge.svg` and no Play badge — confirmed by directory listing. An Android visitor has no way to get the app from the marketing site; the only other affordance is the `Or get product updates` newsletter modal at `:1926` / `:2670`.

**Replacement** — pair every badge, at all three sites:
```html
<div class="store-badges">
    <a href="https://apps.apple.com/app/loomi-sleep-stories-for-kids/id6757821754"
       class="app-store-badge" aria-label="Download Loomi on the App Store">
        <img src="./assets/app-store-badge.svg" alt="Download on the App Store">
    </a>
    <a href="https://play.google.com/store/apps/details?id=com.chimp98.loomi"
       class="app-store-badge" aria-label="Get Loomi on Google Play">
        <img src="./assets/google-play-badge.png" alt="Get it on Google Play">
    </a>
</div>
```
Requires a new asset: `assets/google-play-badge.png`, using Google's own supplied badge artwork per their brand guidelines. Also reword the CSS comments at `index.html:225` and `:252`, which name the Apple badge as *the* CTA (`/* App Store badge (primary post-launch CTA). */`), so the next editor does not read Apple-only as intentional.

### 2.2 — (A) Both apps load `index.html` as the in-app "About Loomi" screen, and it has no app-mode

**Evidence:** `grep -c app-mode` returns **0** for `index.html` and **4** each for `privacy.html`, `terms.html`, `support.html`. The other three carry:
```css
body.app-mode header, body.app-mode footer, body.app-mode nav { display: none !important; }
```

`loomi-app-android/.../ui/web/LoomiLinks.kt:10` is `const val ABOUT_URL = "https://www.loomi.kids"` — no `?app=true`, unlike lines 8-9 for privacy and terms. `SettingsView.swift:459` matches. The URL renders in a full-screen `WebView` (`WebContentScreen.kt:183`) / `SettingsView.swift:456-461`.

**Why it is wrong:** an Android user who taps Settings → About Loomi gets the entire marketing page inside the app, including three "Download on the App Store" buttons, the newsletter modal, and the site footer. A Play reviewer walking the Settings menu sees the same thing.

**Replacement — site side:**
```css
/* App mode ... hide site chrome and store CTAs when loaded inside the app */
body.app-mode header,
body.app-mode footer,
body.app-mode nav,
body.app-mode .hero-cta,
body.app-mode .secondary-cta,
body.app-mode .final-cta {
    display: none !important;
}
```
plus the same `?app=true` detection script the other three pages already carry.

**App-side dependency (not a site change, must ship in the same window):**
- `loomi-app-android/.../ui/web/LoomiLinks.kt:10` → `"https://www.loomi.kids/?app=true"`
- `loomi-app-ios/Loomi/Views/Settings/SettingsView.swift:459` → same

### 2.3 — (B) "No timeline scrubber" is false on both platforms, and "One button" misdescribes the play screen

**Verbatim, `index.html:2134-2135`:**
```html
<h4>One screen. One button. Then darkness.</h4>
<p>Once the story starts, you put the phone down. No timeline scrubber to fidget with, no end-of-episode autoplay prompt, no "you might also like" rail. The play screen does one thing well, then gets out of the way.</p>
```
**And `index.html:2147`:**
```html
<span><strong>A single play button.</strong> No menus, no decisions to make at 8pm.</span>
```

**Why it is wrong:** both apps ship an interactive scrubber. iOS: `PlaybackView.swift:104` (`// Progress (interactive scrubber with chapter marker)`) with a `DragGesture` seek at `:158-171`. Android: `PlaybackScreen.kt:385-456` wires `onSeek` to `detectTapGestures` and `detectDragGestures`. The same screen also carries skip forward/back, a melody toggle and picker, a sleep-timer sheet, a narrator control, and a melody volume slider (`PlaybackScreen.kt:243-307`). The autoplay-prompt and recommendation-rail claims are correct; the scrubber and single-button claims are not.

The dim-to-black claim at `:2153` **is** accurate — `DreamModeManager.kt:80` sets `activationDelay = 8` seconds and `DreamModeOverlay.swift` paints `Color.black` plus a dim starfield.

**Replacement:**
- Heading `:2134` → **One screen. Then darkness.**
- Body `:2135` → *"Once the story starts, you put the phone down. No end-of-episode autoplay prompt, no 'you might also like' rail, nothing that asks for another tap. The controls you need are there if you want them ... and eight seconds later the screen goes dark on its own."*
- Bullet `:2147` → **Everything on one screen.** *Play, sleep timer, melody, narrator ... no menus, no decisions to make at 8pm.*

### 2.4 — (A/B) "Two weeks free" is stated unconditionally — **DECISION**

**Verbatim, `index.html:2571`:**
```html
<p>Try Loomi free for two weeks … then choose what makes sense for your family.</p>
```
**`index.html:2575`:**
```html
<span><strong>Two weeks free.</strong> Full access to every story and voice.</span>
```

**Why it may be wrong:** on iOS this is documented and true (`loomi-app-ios/CLAUDE.md:215` — introductory offer FREE_TRIAL / TWO_WEEKS across 175 territories). On Android there is no such record anywhere, and the app makes no such promise — the trial line is derived at runtime from Play offer data: `PlayBillingService.kt:193-194` sets `trialLine` from `freeTrialPhase(detail)`, which returns null when no phase has `priceAmountMicros == 0` (`:217-221`), and `PaywallScreen.kt:401` falls back to `"Subscribe"` when `trialLine == null`. The Play listing deliberately promises no trial (`docs/play/play-listing.md`, GETTING STARTED). Play's Subscriptions policy treats a mismatched trial claim as a deceptive representation.

**DECISION:** *Are the Play base plans `monthly-autorenew` / `annual-autorenew` configured with a 14-day free-trial offer, and does it apply to new subscribers in all launch territories?* Check Play Console before writing copy.

- **If yes, 14 days:** no change needed to `:2571` / `:2575`. (`terms.html:434` and `support.html:416` still need their separate fixes below.)
- **If no, or a different length:** make the claim conditional rather than deleting it —
  - `:2571` → *"Start with a free trial, then choose what makes sense for your family."*
  - `:2575` → **A free trial to start.** *Full access to every story and voice ... trial length is set by your app store and shown before you confirm.*

### 2.5 — (B) "Refunds, no questions asked" is a promise Loomi cannot keep, and its own Terms say so

**Verbatim, `index.html:2591`:**
```html
<span><strong>Refunds, no questions asked.</strong> Email us. Done.</span>
```

**Why it is wrong:** `terms.html:454` says the opposite — *"Refunds are handled by the store that processed your payment ... Apple for App Store purchases, Google for Google Play purchases. We do not have access to your payment information."* Terms is the accurate document: Apple and Google are merchants of record, purchases go through StoreKit (`SubscriptionService.swift`) and Play Billing (`PlayBillingService.kt`) with no server-side receipt record, and `privacy.html:427` confirms Loomi holds no payment data. A parent who emails expecting a refund gets nothing; a reviewer comparing the marketing page against the Terms sees a direct contradiction. A binding refund promise the EULA disclaims is a consumer-protection exposure, not a copy nit.

**Replacement:**
> **Refund trouble? We'll help.** Apple and Google process the payment, so the refund is theirs to issue ... email us and we'll walk you through it and back you up.

### 2.6 — (C) The flagship affirmation example has an unclosed quote

**Verbatim, `index.html:1975`:**
```html
<p>One morning, Mira woke up and thought, <span class="affirmation">"I want to try something new today. I want to climb that mountain. Even though she'd never done it before, something inside her said she could.</span></p>
```

**Why it is wrong:** the quote opens and never closes, so the narration ("Even though she'd never done it before...") is highlighted and coloured as if Mira said it. This is the one place on the site that demonstrates the product's core content standard, side by side with the plain version, and it reads as broken. `injectContent()` only rewrites `storyColumns[1]` (`:3132-3174`), so this paragraph ships in production exactly as written.

**Replacement:**
```html
<p>One morning, Mira woke up and thought, <span class="affirmation">"I want to try something new today. I want to climb that mountain."</span> Even though she'd never done it before, something inside her said she could.</p>
```

### 2.7 — (C) The newsletter form collects a child's age with no consent line and no Privacy Policy link — **DECISION**

**Verbatim, `index.html:2701-2704` and `:2711`:**
```html
<div class="form-group">
    <label>Child's Age</label>
    <input type="text" name="child_age" placeholder="e.g., 2 years old">
</div>
...
<button type="submit" class="submit-btn">Subscribe</button>
```

**Why it is wrong:** the modal (`:2681-2714`) collects parent name, email, child's age and preferred languages, POSTs them to a Google Apps Script endpoint (`:3325`), and fires a `newsletter_signup` GA event (`:3336`). There is no consent line, no link to `privacy.html`, and nothing in `privacy.html` mentions a mailing list, Google Apps Script, or Google Sheets — the third-party list at `privacy.html:410-415` does not include it. `Subscribe` is the consent action and the reader has been shown nothing to consent to. Every other surface on the site links the policy (`index.html:2625`, `support.html:485`, `terms.html:513`, `components/footer.js:12`); the one form that actually collects a child's data does not.

**Replacement — add above the submit button at `:2711`:**
```html
<p class="form-consent">We'll use this to send product updates, nothing else. You can unsubscribe from any email. See our <a href="./privacy.html">Privacy Policy</a>.</p>
```
**And add to the `privacy.html` third-party list** (see 5.3).

**DECISION:** *Do we keep the "Child's Age" field?* Dropping it is the strongest option — it buys little, and it is the single field that turns a mailing-list form on a child-directed site into a COPPA question. Keeping it requires the consent line above as a minimum.

### 2.8 — (C) `assets/dream-mode.jpg` does not exist and 404s on every page load — **DECISION**

**Verbatim, `index.html:2099-2101`:**
```html
<img src="./assets/dream-mode.jpg"
     alt="Parent and child silhouette in soft moonlight, listening together"
     onerror="this.onerror=null;this.src='./assets/parent-reading-moon.jpg';">
```

**Why it is wrong:** the file is absent from `assets/` (confirmed by directory listing) and returns 404 live. The `onerror` handler masks it visually, so the section renders, but every visitor fires a 404, the `alt` text no longer describes the image actually shown, and `parent-reading-moon.jpg` now appears twice on the page (also `:2236`). A full relative-reference sweep across all five pages found this as the **only** broken local target.

**DECISION:** *Do we have a real dream-mode image to ship, or do we repoint?*
- If yes: add `assets/dream-mode.jpg`, keep the markup, drop the `onerror` shim.
- If no: point `src` straight at the fallback, drop the shim, and fix the `alt` —
```html
<img src="./assets/parent-reading-moon.jpg"
     alt="Parent and child silhouette in soft moonlight, listening together">
```

### 2.9 — (C) No `og:`, `twitter:`, `canonical` or `description` tags anywhere, and the served `<h1>` is empty

**Evidence:** `grep -c "og:"` on `index.html` returns **0**; the same holds for `twitter:`, `rel="canonical"`, `name="description"` and `name="robots"` on all five pages. And the headline is not in the served HTML:

**Verbatim, `index.html:1910`:**
```html
<h1 class="hero-title"></h1>
```
Same for `:1934` (`<h2></h2>`), `:2036`, `:2217`, `:2510` and `:2665` (`<h2 class="cta-title"></h2>`). All are filled at runtime from `LANGUAGES.en` at `:3100-3103`.

**Why it is wrong:** when `www.loomi.kids` is pasted into iMessage, WhatsApp, Slack or Facebook, the preview card has no image, no description, and falls back to the raw `<title>`. For a consumer app about to be shared parent-to-parent, that is a real conversion loss. Related: `loomi-app-ios/Loomi/Components/StoryCard.swift:595` and `StoryHero.swift:156,170` already reference `https://loomi.kids/assets/images/og-image.png`, which 404s — the asset was planned and dropped. (Those are `#Preview`-only, so no user impact.)

**Replacement — head block on `index.html`, with per-page `canonical` / `og:url` / `og:title` on the other four:**
```html
<meta name="description" content="Loomi turns bedtime into a daily ritual for building your child's inner voice ... narrated stories with positive affirmations woven in, for children aged 0 to 6.">
<link rel="canonical" href="https://www.loomi.kids/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Loomi">
<meta property="og:title" content="Loomi ... Bedtime stories that build confidence from the inside out">
<meta property="og:description" content="Narrated bedtime stories with positive affirmations woven in, for children aged 0 to 6. On the App Store and Google Play.">
<meta property="og:url" content="https://www.loomi.kids/">
<meta property="og:image" content="https://www.loomi.kids/assets/og-image.png">
<meta name="twitter:card" content="summary_large_image">
```
Create `assets/og-image.png` at 1200×630. Once it exists, point the two iOS preview constants at it so that reference stops 404ing.

Also give the hero a server-side default so crawlers and no-JS readers see something — the JS at `:3102` overwrites it harmlessly:
```html
<h1 class="hero-title">Loomi helps parents turn bedtime into a daily ritual for building their child's inner voice.</h1>
```

### 2.10 — (C) Copyright reads 2025, in two different wordings

**Verbatim, `index.html:2843`:**
```js
copyright: "© 2025 Loomi. Built with ❤️ by 3 brothers and dads for parents seeking peaceful bedtimes."
```
Plus `:2953` (Spanish) and `:3061` (Persian), and `components/footer.js:10` (see 6.1).

**Why it is wrong:** a year stale, and the two sentences differ. On `index.html` the JS at `:3244-3245` overwrites the footer text with the `LANGUAGES` version, so the home page footer reads *"…for parents seeking peaceful bedtimes."* while `privacy.html`, `terms.html` and `support.html` — which have no such overwrite — read *"…for thoughtful parents seeking peaceful bedtimes for their children."* Same shared footer component, two different lines depending on which page you are on.

**Replacement** — all four to `© 2026`, and align on the `components/footer.js` sentence as the canonical one:
```js
copyright: "© 2026 Loomi. Built with ❤️ by 3 brothers and dads for thoughtful parents seeking peaceful bedtimes for their children."
```

### 2.11 — (C) "stroy" typo in the served HTML

**Verbatim, `index.html:2001`:**
```html
<p><span class="emoji" aria-hidden="true">…</span>just another stroy app</p>
```

**Why it is wrong:** trivially, it is a misspelling. `injectContent()` replaces it at runtime at `:3145-3149` with the correct string from `:2746`, so a normal visitor never sees it — but crawlers, social scrapers and any no-JS reader do, inside the comparison table that argues Loomi is more careful than the competition.

**Replacement:** `just another story app`.

### 2.12 — (C) Video `aria-label` names the platform — **contested**

**Verbatim, `index.html:2158`:**
```html
<video autoplay muted loop playsinline aria-label="Loomi's simplified play screen on iPhone">
```

**Status:** the two skeptics split. One upheld it — the `.feels-image.framed` CSS at `:597-613` draws only a rounded corner and shadow, no device chrome, so "on iPhone" is a gratuitous platform assertion rather than a description of what is visible, and the 294×640 asset is indistinguishable from a Pixel capture. The other refuted it — the footage genuinely is iPhone footage, so the label accurately describes the source. Reported here per the majority rule; treat as optional polish.

**Replacement if taken:** `aria-label="Loomi's simplified play screen"`.

---

## 3. `support.html` (548 lines)

### 3.1 — (A) Subscriptions described as App Store only

**Verbatim, `support.html:409`:**
```html
Loomi offers two subscription plans through the App Store:
```

**Why it is wrong:** Play Billing is wired and shipping (`billing/PlayBillingService.kt`). Worse, `:419` and `:450` on the same page were already corrected in today's pass to name both stores, so the section now contradicts itself two paragraphs apart.

**Replacement:**
> Loomi offers two subscription plans, sold through the App Store on iPhone and Google Play on Android:

### 3.2 — (A/B) The restore-purchases instructions are wrong on iPhone *today* and incomplete on Android

**Verbatim, `support.html:441`:**
```html
Sign in to the new device with the same App Store or Google Play account and install Loomi. On iPhone, open <strong>Settings → Restore Purchases</strong> inside the app. On Android your subscription is restored automatically once you are signed in to Google Play.
```

**Why it is wrong — two separate errors:**
- **There is no Restore Purchases in iOS Settings.** `grep -i restore` across `Views/Settings/` returns only unrelated comments. iOS Settings offers only "Subscription → Loomi Premium" (`SettingsView.swift:313-318`); the control lives on the paywall — `PaywallView.swift:341` → `Text("Restore Purchases")` → `handleRestore()` at `:457`.
- **Android has the same button and this page hides it.** `PaywallScreen.kt:409` → `text = "Restore purchases"`, backed by `PaywallViewModel.kt:213-229` and `BillingService.restorePurchases()` (`BillingService.kt:105`). Telling Android parents it is automatic leaves them with no next step when a purchase is pending or deferred — a state `OwnedSubscriptions.kt:97` explicitly handles.

This one is wrong on iPhone today, independent of the Android launch.

**Replacement:**
> Sign in to the new device with the same App Store or Google Play account, then install Loomi and sign in to your Loomi account. Your subscription usually restores on its own. If it does not, open the subscription screen and tap **Restore Purchases** at the bottom ... same place on iPhone and Android.

### 3.3 — (A) "Loomi is currently designed for iPhone"

**Verbatim, `support.html:468-471`:**
```html
<h3>Can I use Loomi on iPad?</h3>
<p>
    Loomi is currently designed for iPhone. You can install it on iPad and run in compatibility mode, but the experience is optimised for iPhone. Native iPad support may come in a future release.
</p>
```

**Why it is wrong:** on launch day this reads as the app not existing on Android at all — the single most exclusionary sentence on the site. The tablet answer also generalises: the Android app is portrait-locked (`AndroidManifest.xml:48` → `android:screenOrientation="portrait"`) with no `res/layout-*` or `res/values-sw*` large-screen resources, so an Android tablet sits in exactly the position an iPad does.

**Replacement:**
> ### Can I use Loomi on a tablet?
>
> Loomi is designed for phones ... iPhone and Android. It installs and runs on an iPad or an Android tablet, but the layout is tuned for a phone screen. Proper tablet support may come in a future release.

### 3.4 — (A) Apple's EULA presented as the licence for every user — **DECISION**

**Verbatim, `support.html:491-492`:**
```html
<li><a href="./terms.html">Terms of Service</a></li>
<li>EULA: Loomi uses Apple's <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">Standard End User License Agreement</a></li>
```

**Why it is wrong:** three documents currently claim to be the EULA, and they disagree.
- `terms.html:376` is titled **End User License Agreement (EULA)** and at `:538` claims to be the entire agreement.
- This support line says **Apple's Standard EULA** governs.
- The Android app points its EULA entry at **Google Play's terms** — `LoomiLinks.kt:11` → `https://play.google.com/intl/en_us/about/play-terms/index.html`, surfaced as `EULA("eula", "Licence Agreement", ...)` at `LoomiLinks.kt:22`.

Meanwhile the Android app renders `terms.html` as its **Terms of Service** (`LoomiLinks.kt:9`), and `components/footer.js:13` labels the same file "Terms of Service" on every page. A Play reviewer checking the support URL finds the app claiming to be licensed under Apple's terms.

**DECISION:** *Which document is Loomi's licence agreement?* Two coherent answers:
- **(a) `terms.html` is the EULA on both platforms** — then `support.html:492` should point there, `LoomiLinks.kt:11` should change to `https://www.loomi.kids/terms.html?app=true`, and the store terms are mentioned as additional, not governing.
- **(b) Store-standard EULAs govern per platform** — then `terms.html` should be retitled "Terms of Service" (which is what every consumer of it already calls it) and stop claiming entire-agreement status.

**Replacement copy assuming (b), the smaller change:**
```html
<li><a href="./terms.html">Terms of Service &amp; EULA</a> ... the licence agreement between you and Loomi, on both platforms</li>
<li>Store terms also apply to your purchase ... Apple's <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">Standard EULA</a> on iPhone, and <a href="https://play.google.com/intl/en_us/about/play-terms/index.html">Google Play's Terms of Service</a> on Android</li>
```

### 3.5 — (A) Troubleshooting asks every user for an iPhone

**Verbatim, `support.html:460`:**
```html
<li>If the issue persists, email <a href="mailto:support@loomi.kids">support@loomi.kids</a> with your iPhone model and iOS version</li>
```
**Verbatim, `support.html:502`:**
```html
<li>Your iPhone model and iOS version (Settings → General → About)</li>
```

**Why it is wrong:** these are the only two places the page tells a user how to ask for help, and both assume Apple hardware. `Settings → General → About` has no Android equivalent. An Android parent concludes either that the app is not for them or that support cannot help them.

**Replacement:**
- `:460` → *If the issue persists, email support@loomi.kids with your phone model and OS version*
- `:502` → *Your phone model and OS version ... on iPhone in Settings → General → About, on Android in Settings → About phone*

### 3.6 — (B) "Cancel anytime before the trial ends" contradicts the Terms and both apps

**Verbatim, `support.html:416`:**
```html
Both plans start with a <strong>14-day free trial</strong>. You can cancel anytime before the trial ends and you won't be charged ... on iPhone in Settings → Apple Account → Subscriptions, on Android in the Play Store under Subscriptions.
```

**Why it is wrong:** `terms.html:446` says *"…at least 24 hours before the end of the current billing period."* Both apps agree with the Terms, not with support: `PaywallView.swift:327` ("unless cancelled at least 24 hours before the trial ends") and `PaywallScreen.kt:426-428` ("unless you cancel at least 24 hours before it ends"). A parent who cancels on day 14 gets billed while holding our own support page saying they would not be.

**Replacement:**
> Both plans normally start with a **14-day free trial**. Cancel at least **24 hours** before the trial ends and you won't be charged ... on iPhone in Settings → Apple Account → Subscriptions, on Android in the Play Store under Subscriptions. If you've subscribed before, the store may not offer the trial again.

### 3.7 — (B) "We do not collect personal information from children"

**Verbatim, `support.html:478`:**
```html
<li>We do <strong>not</strong> collect personal information from children</li>
```

**Why it is wrong:** this survived today's privacy pass and is now flatly contradicted by `privacy.html:378-380`, which describes collecting the child's first name, age band and full listening activity into Firestore under the parent's account. Ground truth: `Child.kt:23-28` persists `name` + `ageRange` + `createdAt` as a Firestore document under `users/{uid}/children` (`SettingsViewModel.kt:462,469`); `Child.swift:13` is the iOS twin. `docs/play/play-answers.md` §4 declares exactly this to Play — *"Name (child's first name) | Yes"*. A Play Families reviewer diffing the Data safety form against the linked policy sees a direct contradiction.

**Replacement:**
> Children are never asked for information directly ... the first name and age band you enter live in **your** account, and are never sold or used for advertising.

### 3.8 — (B) "Loomi runs no servers of its own" and "nothing that identifies you"

**Verbatim, `support.html:449`:**
```html
<p><strong>What is kept, and for how long:</strong> nothing that identifies you. Loomi runs no servers of its own ... your data lives in Google Firebase, and once your account is deleted the records above are gone from it. ...
```

**Why it is wrong:** contradicted on the same site by `privacy.html:414`, which calls Argus *"our own feature-flag service"*. Argus is a Loomi-side service on a separate Firebase project and it receives the authenticated Firebase uid — `ArgusInstallIdentity.kt:27-28` (`authenticatedUserId?.takeIf { it.isNotEmpty() } ?: installUuid()`). The deletion routine at `SettingsViewModel.kt:461-497` clears the user doc, children, story state, settings, surveys and the auth user — it never touches Argus, and Crashlytics installation IDs survive too.

**Replacement:**
> **What is kept, and for how long:** your account record, profiles, listening activity, settings and survey answers are removed from our Firebase database immediately. Two things linger and are not linked to your name: a random identifier in our feature-flag service, and crash reports carrying a device model and an anonymous installation code. Anonymous, aggregated usage statistics that can no longer be tied to your account may remain in our analytics, and Google keeps its own operational logs under its retention policies, which we do not control.

**Note:** a wording fix is the minimum. *Separate question for the backlog: should the deletion routine sweep the Argus identity and reset the Crashlytics installation ID, so the stronger claim becomes true?*

### 3.9 — (C) "Last Updated" predates the content in the file

**Verbatim, `support.html:382`:**
```html
<p class="last-updated"><strong>Last Updated:</strong> May 2026</p>
```

**Why it is wrong:** the file already carries the "On Android" cancellation block at `:431-437` and Google Play copy at `:419` and `:450`, none of which existed in May.

**Replacement:** set to the date this branch ships (August 2026).

---

## 4. `terms.html` (587 lines)

### 4.1 — (A) Regional pricing attributed to the App Store alone, and the trial stated unconditionally

**Verbatim, `terms.html:434`:**
```html
Both plans include a <strong>14-day free trial</strong> for new subscribers. Prices are listed in Canadian dollars and may vary by region based on App Store pricing.
```

**Why it is wrong:** every other clause in section 5 was already dual-platformed (`:445`, `:448`, `:454`), so this is the straggler. It matters legally, because this is the document the Android app renders as its Terms (`LoomiLinks.kt:9`) and Play sets its own regional price tiers. The trial half is stale for the same reason as 2.4, and the file already hedges at `:449` ("If a free trial is offered"), so it contradicts itself.

**Replacement:**
> Both plans are normally offered with a **14-day free trial** for new subscribers. Trial eligibility is decided by the App Store or Google Play. Prices are listed in Canadian dollars and may vary by region based on App Store or Google Play pricing.

### 4.2 — (B) "No external links" is false, and contradicts `support.html`

**Verbatim, `terms.html:507`** (under Children's Safety):
```html
<li>No external links</li>
```

**Why it is wrong:** both apps open web content, all of it deliberately gated. Android: `LoomiLinks.kt:9-12` (privacy, terms, `https://www.loomi.kids`, and Google Play's terms), plus a `mailto:support@loomi.kids` intent, gated through `ParentalGateDialog` at `RootNavigation.kt:282-295` / `:455-456`. iOS: `PaywallView.swift:395/:401/:407` and a `mailto:` at `SettingsView.swift:564-570` that fires `UIApplication.shared.open` — an unambiguous hand-off out of the app. `support.html:482` on the same site already says the accurate thing: *"Subscription purchases and external links are protected behind a parental gate."*

Saying "no external links" in a legal document throws away a compliance feature that was deliberately built (`ParentalGateView.swift`, `ParentalGateDialog.kt`) and states something a reviewer can disprove in thirty seconds.

**Replacement:**
> No links out of the app for a child to follow ... the few links we do have (About, our legal pages, the support email, and the subscription screen) each sit behind a parental gate.

Consider also tightening `:506` to *"No purchases reachable without passing a parental gate."*

### 4.3 — (C) Document title conflicts with every consumer of it — see 3.4

`terms.html:376` is `<h1 class="page-title">End User License Agreement (EULA)</h1>`, while `components/footer.js:13`, `support.html:491`, and both apps (`LoomiLinks.kt:9`, `PaywallView.swift:394`) present it as **Terms of Service**. Resolution depends on the EULA decision in 3.4.

### 4.4 — (C) "Last Updated" predates the content in the file

**Verbatim, `terms.html:377`:**
```html
<p class="last-updated"><strong>Last Updated:</strong> March 2026</p>
```

**Why it is wrong:** the same file already carries Android-era text at `:445` ("…or your Google Play account on Android"), `:448` ("…in the Play Store under Subscriptions on Android"), `:454` ("…Google for Google Play purchases") and `:469` ("…on either iPhone or Android"). A reviewer reading a EULA dated March that describes a platform that shipped in August will question whether the document is current.

**Replacement:** set to the date this branch ships (August 2026).

---

## 5. `privacy.html` (528 lines)

`privacy.html:361` reads **August 2026** and is correct — no date change needed here.

### 5.1 — (B) "We do not collect children's personal information"

**Verbatim, `privacy.html:386`:**
```html
<li>We do <strong>not</strong> collect children's personal information</li>
```

**Why it is wrong:** contradicted six lines above by `:378-380`, which discloses collecting the child's first name, age range and listening activity into Firestore. Same evidence as 3.7. This survived today's privacy pass — the COPPA paragraph at `:370` was corrected, the bullet was not. This is the most quotable contradiction on the site.

**Replacement:**
> We do **not** ask a child for any information directly ... everything we hold about a child is entered by you, the parent.

### 5.2 — (B) "We do not use cookies or similar tracking technologies", on a page that loads Google Analytics

**Verbatim, `privacy.html:389`:**
```html
<li>We do <strong>not</strong> use cookies or similar tracking technologies</li>
```
**Related, `index.html:2611`:**
```html
<span><strong>No tracking pixels.</strong> We don't follow you around the internet.</span>
```

**Why it is wrong:** every page on the site loads the `G-VMFQHMVH6N` gtag snippet — `privacy.html:20-26`, and the same tag on `index.html`, `terms.html`, `support.html`, `install.html`. GA sets first-party `_ga` / `_ga_*` cookies. The word "cookie" appears nowhere on the site except this denial, there is no consent banner anywhere in the repo, and `privacy.html:365` scopes the policy to *"when you use the Loomi app"* — so the website's own analytics are disclosed nowhere at all. This is the exact sentence a regulator or a diligent reviewer would quote back.

The claim is true **of the app**; it is printed on a page that is tracking the reader as they read it.

**Replacement — `privacy.html:389`:**
```html
<li>The <strong>Loomi app</strong> uses no cookies, no advertising identifiers, and no cross-app or cross-site tracking</li>
```
**Add a section to `privacy.html`, before Third-Party Services:**
> ### Our Website
> loomi.kids uses Google Analytics to count visits and see which pages are useful. It sets a first-party cookie and records a truncated IP address. It is not connected to your Loomi account or to any child profile, and we do not use it for advertising. You can block it in your browser settings without affecting the app.

**`index.html:2611`** is the weaker half — first-party GA is not cross-site tracking — but reword it for consistency:
> **No ad tracking.** No advertising SDKs, no cross-app tracking, no profiles sold to anyone.

### 5.3 — (C) The mailing list is not in the third-party services list

The third-party list at `privacy.html:410-415` names Google Sign-In, Google Play, Firebase, Crashlytics and Argus — but not the Apps Script / Sheets endpoint that receives the newsletter form data (`index.html:3325`). Pairs with 2.7.

**Add:**
> **Google Workspace** ... if you sign up for product updates on our website, the name, email address and age you type go into a private Google Sheet we own. It is never linked to your Loomi account, and you can ask us to delete it at any time.

### 5.4 — (C) The home page claims GDPR-K and Law 25 compliance the policy does not support — **DECISION**

**Verbatim, `index.html:2619`** (the claim lives on the home page; the gap lives here):
```html
<span><strong>Built to children's privacy law.</strong> Loomi meets COPPA, GDPR-K, and Quebec's Law 25 as a baseline … not a roadmap item.</span>
```

**Why it is wrong:** `privacy.html` names COPPA once (`:370`) and nothing else. There is no lawful-basis statement, no GDPR data-subject rights section (access, rectification, portability, objection, withdrawal of consent), no supervisory-authority complaint right, no international-transfer disclosure, no EU representative, and no Law 25 privacy-officer contact or automated-decision statement — all of which those two regimes require *in the policy itself*. The Parental Rights section at `:455-461` offers three informal rights, short of both. Claiming compliance on the marketing page while the policy omits the mandatory disclosures is worse than claiming nothing.

**DECISION:** *Are we launching in the EU and Quebec, and do we want to carry the full disclosure burden?*
- **(a) Soften the claim now** — `index.html:2619` → *"**Built around children's privacy law.** COPPA, GDPR-K and Quebec's Law 25 shaped how we designed Loomi ... read exactly what we hold in the Privacy Policy."*
- **(b) Preferred before an EU/Quebec launch** — add the lawful-basis, data-subject-rights, transfer and privacy-officer sections to `privacy.html` and keep the stronger claim.

---

## 6. `components/footer.js`

### 6.1 — (C) Copyright reads 2025

**Verbatim, `components/footer.js:10`:**
```html
<p style="margin-top: 10px; font-size: 14px;">&copy; 2025 Loomi. Built with ❤️ by 3 brothers and dads for thoughtful parents seeking peaceful bedtimes for their children.</p>
```

**Why it is wrong:** a year stale, and diverges from the `index.html` string (see 2.10). The in-app iOS mirror at `SettingsView.swift:417` also reads 2025.

**Replacement:** `&copy; 2026 Loomi. Built with ❤️ by 3 brothers and dads for thoughtful parents seeking peaceful bedtimes for their children.` — and make `index.html:2843` match this sentence exactly.

---

## 7. `site.webmanifest`

### 7.1 — (A/C) Empty name fields, white theme colours, and not linked from any page

**Verbatim, the entire file:**
```json
{"name":"","short_name":"","icons":[{"src":"/android-chrome-192x192.png","sizes":"192x192","type":"image/png"},{"src":"/android-chrome-512x512.png","sizes":"512x512","type":"image/png"}],"theme_color":"#ffffff","background_color":"#ffffff","display":"standalone"}
```

**Why it is wrong — two problems:**
1. **No page references it.** `grep -c manifest` returns **0** on all five pages. The file is served but nothing points a browser at it, so the two Android icons it declares are never used. `README.md:44` already claims the file's job: *"PWA manifest (Android home-screen icons)"*.
2. **`name` and `short_name` are empty strings.** This is the Android-facing manifest on the platform about to launch. "Add to Home Screen" from Chrome on Android produces an unnamed icon. `theme_color` / `background_color` are `#ffffff`, which flashes white on a site whose body is `#0a0e1f` (`index.html:40`) — the opposite of the brand.

**Replacement:**
```json
{"name":"Loomi ... Bedtime Stories for Kids","short_name":"Loomi","icons":[{"src":"/android-chrome-192x192.png","sizes":"192x192","type":"image/png"},{"src":"/android-chrome-512x512.png","sizes":"512x512","type":"image/png"}],"theme_color":"#0A0E1F","background_color":"#0A0E1F","display":"standalone","start_url":"/"}
```
plus `<link rel="manifest" href="./site.webmanifest">` after the favicon block on all five pages.

---

## 8. `scripts/Code.js` — the mailing-list backend

Outside the named file list, but it is the destination of the newsletter form (`index.html:2687`) — the site's only remaining CTA for Android visitors today, which puts it in scope.

### 8.1 — (A/B) The welcome email is Apple-only and tells every signup to use an Apple ID

**Verbatim, `scripts/Code.js:11` and `:14`:**
```js
var APP_STORE_LINK = "https://apps.apple.com/app/loomi-sleep-stories-for-kids/id6757821754";
var APP_STORE_REVIEW_LINK = "https://apps.apple.com/app/loomi-sleep-stories-for-kids/id6757821754?action=write-review";
```
**`:137` (HTML) and `:203` (plain text):**
```
Loomi is now on the App Store. Tap below to install.
```
**`:157` (HTML) and `:205` (plain text):**
```
Once you've installed Loomi, sign in with your Apple ID, set up your child's profile, and pick your first story.
```
`:145` embeds `app-store-badge.svg`. The launch-day and review-request emails at `:337`, `:345`, `:398`, `:400`, `:440`, `:466` are App-Store-only in the same way.

**Why it is wrong:** *"Sign in with your Apple ID"* is wrong even on iPhone — Google sign-in ships on both platforms (`LoomiApp.swift:16,35` imports and configures `GIDSignIn`; Android has `auth/GoogleCredentialService.kt` alongside `AppleCredentialService.kt`). And every Android signup gets an Apple-only welcome email.

**Replacement:**
- `:137` / `:203` → **Loomi is now on the App Store and Google Play. Tap below to install.** with both badges (`:145` needs a `google-play-badge.png` hosted alongside the Apple one).
- `:157` / `:205` → **Once you've installed Loomi, sign in with Apple or Google, set up your child's profile, and pick your first story.**
- `:345` / `:400` / `:440` / `:466` → **an honest review on the App Store or Google Play**, and either gate `APP_STORE_REVIEW_LINK` on which store the subscriber came from, or offer both links.

**Caveat:** this is a Google Apps Script deployment. Fixing the repo copy changes nothing for subscribers until it is re-pushed via clasp.

---

## 9. Repo hygiene — publishes to the live site on merge

### 9.1 — (C) An internal privacy-audit document sits in the repo and will publish

`docs/privacy-audit-2026-08-18.md` (25.9 KB) is tracked, and `.gitignore` covers only:
```
scripts/.clasp.json
.DS_Store
node_modules/
```
GitHub Pages serves the whole repo root. Already public and confirmed live today: `README.md` (the internal ops runbook, including the live Apps Script deployment ID at `:69`), `scripts/Code.js` (the mailing-list backend source — no credentials in it), and `misc/wireframe plan/loomi_landing_wireframe_polished.pdf`.

None of it is a secret, but publishing a document titled "privacy audit" on the domain whose privacy policy it critiques, days before a Play review, is an avoidable own goal.

**Replacement — do NOT do this via `.gitignore`.** Adding `README.md` / `scripts/` there would untrack files that should stay in version control. Use a Jekyll exclusion, which GitHub Pages honours:
```yaml
# _config.yml
exclude:
  - docs/
  - misc/
  - README.md
  - scripts/
```

---

## Product decisions required (six)

These cannot be resolved by rewriting copy. Each blocks the finding it belongs to.

| # | Finding | Question |
|---|---|---|
| 1 | 1.1, 2.1 | The Play listing URL 404s today. Do we ship the site change with the Play URL pre-wired, or hold until the listing is published? |
| 2 | 2.4, 3.6, 4.1 | Are the Play base plans configured with a 14-day free-trial offer for new subscribers in all launch territories? Copy branches on the answer. |
| 3 | 2.7 | Do we keep the "Child's Age" field on the newsletter form, or drop it? Keeping it requires a consent line and a privacy-policy entry at minimum. |
| 4 | 2.8 | Do we have a real `dream-mode.jpg` to ship, or do we repoint the `<img>` at `parent-reading-moon.jpg` and fix the `alt`? |
| 5 | 3.4, 4.3 | Which document is Loomi's licence agreement — `terms.html` on both platforms, or the store-standard EULAs per platform? Three surfaces currently disagree. |
| 6 | 5.4 | Are we launching in the EU and Quebec? Either soften the COPPA/GDPR-K/Law 25 claim, or add the mandatory disclosures to `privacy.html`. |

Plus one backlog question, not blocking: should the account-deletion routine sweep the Argus identity and reset the Crashlytics installation ID (3.8), so the stronger "nothing that identifies you" claim becomes true rather than softened?

## App-repo dependencies (not site files, same ship window)

- `loomi-app-android/.../ui/web/LoomiLinks.kt:10` — `ABOUT_URL` needs `?app=true` (finding 2.2)
- `loomi-app-ios/Loomi/Views/Settings/SettingsView.swift:459` — same (finding 2.2)
- `loomi-app-android/.../ui/web/LoomiLinks.kt:11` — `EULA_URL`, pending decision 5
- `loomi-app-ios/Loomi/Views/Settings/SettingsView.swift:417` — `© 2025` (finding 6.1)
- `loomi-app-ios/Loomi/Components/StoryCard.swift:595`, `StoryHero.swift:156,170` — reference a 404ing `og-image.png`; fix once the asset exists (finding 2.9)

---

## Refuted, no action

Considered and dismissed by the skeptics. Listed so nobody re-raises them.

- **`index.html:2734` / `:2836` CMS strings `"Download on the App Store"`** — dead code. `btn-primary` appears only in CSS (`:206`, `:220`) and in the `querySelectorAll` at `:3114`, never as a class in markup, and the injector additionally only overwrites text containing "Join" or empty. No user, screen reader or crawler sees these. A latent editing trap, not site language.
- **"Affirmation infusion technology"** (`index.html:1935`, `:2741`) — no processing engine exists (`Story.kt:86-87` are metadata fields), but the same sentence already explains the mechanism as "weaving positive affirmations naturally into engaging narratives". Marketing puffery, not a claim about a shipped feature.
- **"Low blue light"** (`index.html:2117`) — neither app shifts colour temperature, but `#0A0E1F` emits blue at roughly 12% of full channel and the claim is about low emitted light, not hue ratio. Defensible as written.
- **The site never mentions the library, the seven collections, or the feature list** — verified true as an observation (no collection name, no "sleep timer" / "offline" / "lock screen" / "profile" anywhere in `index.html`), but nothing on the page is *false*. This is a request to author a new marketing section, not a stale-claim fix. Worth doing separately; `docs/play/play-listing.md` is already written in house style and verified against code.
- **The English page never states ages 0-6** — the only age statements sit in the inactive `es` / `fa` blocks (`:2854`, `:2962`) and in research modals, with `currentLanguage = 'en'` pinned at `:3070`. An omission, not a false claim. Editorial preference.
- **Health-outcome claims vs. the warranty disclaimer** (`index.html:2062`, `:2078`, `:2233`, `:2539`, `:3514`) — the bullets sit inside the Three Pillars section (`:2034-2084`), where each card describes its *pillar*; `:2078` "Physical growth & immunity" is under `<h3>Deep Sleep</h3>`, not attributed to Loomi. `:3514` is hedged ("could indirectly support"). A disclaimer of *guaranteed results* is the standard, non-contradictory counterpart to benefit marketing. Substantiation tone is a marketing judgement call, not a cross-document inconsistency.
- **`README.md:3` and `:33`** (Apple-only framing, "Auto-redirect to App Store") — internal repo documentation, and `:33` accurately describes what `install.html` does today. Becomes a follow-up edit only after finding 1.1 lands.
- **Missing Android tablet FAQ entry** — adding a new FAQ is an enhancement. The real defect is the sentence already on the page (`support.html:470`), captured as finding 3.3.
- **`index.html:2158` video `aria-label`** — split verdict; reported as contested at 2.12 rather than silently dropped.

## Checked and clean

`components/footer.js` carries no platform assumptions beyond the copyright year. All eight research-modal cards map to the correct `RESEARCH_DATA` index. Every local asset reference resolves except `dream-mode.jpg`. All favicon files exist at their declared dimensions. `app-mode` works correctly on `privacy.html`, `terms.html` and `support.html`. The extensionless URL at `terms.html:513` resolves. The Apps Script endpoint at `index.html:3325` matches `README.md:69`. All `mailto:` addresses are consistent and match the apps. Every external URL resolves (publisher 403s are bot-blocking, not dead links). The GA measurement ID is identical across all five pages. Pricing `$4.99` / `$49.99` CAD (`terms.html:430-431`) matches `LoomiSubscriptions.storekit`. Narrator states (Natasha and Dr Z active, Grandma and Grandpa "Coming soon", `index.html:2192-2210`) match the `Narrator.isComingSoon` model — worth one confirm that neither grandparent voice has since shipped in Firestore.