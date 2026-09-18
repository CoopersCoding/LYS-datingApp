function initLYSEnhancements() {
  const root = document.querySelector("[data-lys-root]")
  if (!root || root.dataset.lysEnhancementsInitialized === "true") return

  root.dataset.lysEnhancementsInitialized = "true"

  const welcome = root.querySelector("[data-welcome-screen]")
  const appShell = root.querySelector("[data-app-shell]")
  const profileStream = root.querySelector("[data-profile-stream]")
  const toast = root.querySelector("[data-toast]")
  const profileCards = Array.from(root.querySelectorAll("[data-profile]"))
  const archived = new Set(JSON.parse(window.localStorage.getItem("lysArchivedProfiles") || "[]"))
  const connected = new Set(JSON.parse(window.localStorage.getItem("lysConnectedProfiles") || "[]"))
  let toastTimer
  let activePool = "friendship"
  let detailCard = null

  const genderByName = {
    Maya: "woman",
    Daniel: "man",
    Olivia: "woman",
    Marcus: "man"
  }

  const voiceByName = {
    Maya: "0:18 voice intro",
    Daniel: "0:21 voice intro",
    Olivia: "0:16 voice intro",
    Marcus: "0:20 voice intro"
  }

  function showToast(message) {
    if (!toast) return
    window.clearTimeout(toastTimer)
    toast.textContent = message
    toast.hidden = false
    toastTimer = window.setTimeout(() => {
      toast.hidden = true
    }, 2400)
  }

  function profileName(card) {
    const heading = card && card.querySelector(".lys-profile-heading h2")
    return heading ? heading.textContent.split(",")[0].trim() : "Profile"
  }

  function profileGender(card) {
    const name = profileName(card)
    return card.dataset.gender || genderByName[name] || ""
  }

  function saveArchived() {
    window.localStorage.setItem("lysArchivedProfiles", JSON.stringify(Array.from(archived)))
  }

  function saveConnected() {
    window.localStorage.setItem("lysConnectedProfiles", JSON.stringify(Array.from(connected)))
  }

  function currentGender() {
    return root.dataset.currentGender || window.sessionStorage.getItem("lysCurrentGender") || "man"
  }

  function romanticTargetGender() {
    return currentGender() === "woman" ? "man" : "woman"
  }

  profileCards.forEach((card) => {
    card.dataset.gender = genderByName[profileName(card)] || ""
  })

  function visibleCards() {
    return profileCards.filter((card) => !card.hidden)
  }

  function updateArchiveCount() {
    const count = root.querySelector("[data-archive-count]")
    if (count) count.textContent = String(archived.size)
  }

  function scrollToNextVisible() {
    const next = visibleCards()[0]
    if (next) {
      window.setTimeout(() => next.scrollIntoView({ behavior: "smooth", block: "start" }), 80)
    } else {
      showToast(activePool === "romance" ? "You reached the end of your dating preview." : "You reached the end of your friendship preview.")
    }
  }

  function applyPoolFilter(pool) {
    activePool = pool

    root.querySelectorAll("[data-pool]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.pool === pool)
    })

    profileCards.forEach((card) => {
      const name = profileName(card)
      const wrongLane = card.dataset.intent !== pool
      const wrongRomanticGender = pool === "romance" && profileGender(card) !== romanticTargetGender()
      const unavailable = archived.has(name) || connected.has(name)
      card.hidden = wrongLane || wrongRomanticGender || unavailable
      card.style.transform = ""
      card.style.opacity = ""
    })

    if (profileStream) profileStream.scrollTo({ top: 0, behavior: "smooth" })
  }

  function archiveCard(card) {
    if (!card) return
    const name = profileName(card)
    archived.add(name)
    saveArchived()
    card.style.transition = "transform 180ms ease, opacity 180ms ease"
    card.style.transform = "translateX(-110%) rotate(-4deg)"
    card.style.opacity = "0"
    showToast(`${name} moved to your Archive.`)
    updateArchiveCount()
    window.setTimeout(() => {
      applyPoolFilter(activePool)
      scrollToNextVisible()
    }, 190)
  }

  function connectCard(card) {
    if (!card) return
    const name = profileName(card)
    const button = card.querySelector("[data-connect]")
    connected.add(name)
    saveConnected()
    if (button) {
      button.textContent = "Request sent"
      button.disabled = true
    }
    showToast(activePool === "romance" ? `Interest sent to ${name}.` : `Connection request sent to ${name}.`)
    card.style.transition = "transform 180ms ease, opacity 180ms ease"
    card.style.transform = "translateX(110%) rotate(4deg)"
    card.style.opacity = "0"
    window.setTimeout(() => {
      applyPoolFilter(activePool)
      scrollToNextVisible()
    }, 260)
  }

  async function apiRequest(path, options = {}) {
    const headers = Object.assign(
      { "Accept": "application/json" },
      options.headers || {}
    )

    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json"
    }

    const csrfToken = document.querySelector("meta[name='csrf-token']")?.content
    if (csrfToken && options.method && options.method.toUpperCase() !== "GET") {
      headers["X-CSRF-Token"] = csrfToken
    }

    const response = await fetch(path, Object.assign({}, options, {
      headers,
      credentials: "same-origin"
    }))

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = data.error || (data.errors && data.errors.join(", ")) || "Something went wrong."
      throw new Error(message)
    }

    return data
  }

  let currentProfile = null

  function renderCurrentProfile(user) {
    if (!user) return
    currentProfile = user

    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ")
    const location = [user.city, user.state].filter(Boolean).join(", ")

    const nameEl = root.querySelector("[data-current-profile-name]")
    const locationEl = root.querySelector("[data-current-profile-location]")
    const bioEl = root.querySelector("[data-current-profile-bio]")
    const photoEl = root.querySelector("[data-current-profile-photo]")
    const chipName = root.querySelector(".lys-profile-chip-copy strong")
    const chipInitials = root.querySelector(".lys-profile-chip > span:first-child")

    if (nameEl) nameEl.textContent = fullName || user.first_name || "Member"
    if (locationEl) locationEl.textContent = location || "Location not added"
    if (bioEl) bioEl.textContent = user.bio || "Add a few words about yourself so people know what matters to you."
    if (photoEl && user.profile_image_url) photoEl.src = user.profile_image_url
    if (chipName) chipName.textContent = user.first_name || "Member"
    if (chipInitials) {
      const initials = [user.first_name, user.last_name].filter(Boolean).map((part) => part[0]).join("").slice(0, 2)
      chipInitials.textContent = initials.toUpperCase() || "LY"
    }

    root.dataset.currentGender = user.gender || root.dataset.currentGender || "man"
  }

  async function loadCurrentProfile() {
    try {
      const data = await apiRequest("/api/me")
      renderCurrentProfile(data.user)
      return data.user
    } catch (_error) {
      return null
    }
  }

  function openProfileEditor(focusPhoto = false) {
    if (!profileEditScreen) return

    const fill = (user) => {
      if (!user) return
      const form = profileEditScreen.querySelector("[data-profile-edit-form]")
      if (!form) return

      form.elements.first_name.value = user.first_name || ""
      form.elements.last_name.value = user.last_name || ""
      form.elements.city.value = user.city || ""
      form.elements.state.value = user.state || ""
      form.elements.bio.value = user.bio || ""
      form.elements.profile_image_file.value = ""
      form.elements.looking_for_friendship.checked = Boolean(user.looking_for_friendship)
      form.elements.looking_for_romance.checked = Boolean(user.looking_for_romance)

      profileEditScreen.hidden = false
      document.body.classList.add("lys-modal-open")

      window.setTimeout(() => {
        const target = focusPhoto ? form.elements.profile_image_file : form.elements.bio
        target?.focus()
        if (focusPhoto) target?.click()
      }, 60)
    }

    if (currentProfile) fill(currentProfile)
    else loadCurrentProfile().then(fill)
  }

  function closeProfileEditor() {
    if (!profileEditScreen) return
    profileEditScreen.hidden = true
    document.body.classList.remove("lys-modal-open")
  }

  function enterApp(name, gender) {
    const resolvedName = name || "Brian"
    const resolvedGender = gender === "woman" ? "woman" : "man"
    root.dataset.currentGender = resolvedGender
    window.sessionStorage.setItem("lysPrototypeSignedIn", "true")
    window.sessionStorage.setItem("lysCurrentGender", resolvedGender)
    window.sessionStorage.setItem("lysCurrentName", resolvedName)

    const chipName = root.querySelector(".lys-profile-chip-copy strong")
    const chipInitials = root.querySelector(".lys-profile-chip > span:first-child")
    if (chipName) chipName.textContent = resolvedName
    if (chipInitials) chipInitials.textContent = resolvedName.slice(0, 2).toUpperCase()

    if (welcome) welcome.hidden = true
    if (appShell) appShell.hidden = false

    root.querySelectorAll("[data-page]").forEach((page) => {
      const active = page.dataset.page === "discover"
      page.hidden = !active
      page.classList.toggle("is-active", active)
    })

    root.querySelectorAll("[data-nav]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.nav === "discover")
    })

    window.history.replaceState(null, "", "#discover")
    applyPoolFilter("friendship")
    closeAuth()
    loadCurrentProfile()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  root.insertAdjacentHTML("beforeend", `
    <div class="lys-auth-screen" data-auth-screen hidden>
      <div class="lys-auth-card" role="dialog" aria-modal="true" aria-labelledby="lys-auth-title">
        <button class="lys-auth-close" type="button" data-auth-close aria-label="Close">Close</button>
        <div class="lys-auth-brand">
          <span class="lys-brand-mark">LYS</span>
          <div>
            <strong>Last Year Single</strong>
            <span>Friendship. Dating. Real connection.</span>
          </div>
        </div>
        <div class="lys-auth-tabs" role="tablist" aria-label="Account access">
          <button type="button" class="is-active" data-auth-tab="signin">Sign in</button>
          <button type="button" data-auth-tab="signup">Sign up</button>
        </div>
        <section data-auth-pane="signin">
          <p class="lys-eyebrow">Welcome back</p>
          <h2 id="lys-auth-title">Sign in to your community.</h2>
          <form data-signin-preview>
            <label><span>Email</span><input type="email" name="email" placeholder="you@example.com" required /></label>
            <label><span>Password</span><input type="password" name="password" placeholder="Your password" required /></label>
            <button class="lys-button lys-button-full" type="submit">Sign in</button>
          </form>
        </section>
        <section data-auth-pane="signup" hidden>
          <p class="lys-eyebrow">Join Last Year Single</p>
          <h2>Create your profile.</h2>
          <form data-signup-preview>
            <div class="lys-auth-name-grid">
              <label><span>First name</span><input type="text" name="first_name" required /></label>
              <label><span>Last name</span><input type="text" name="last_name" required /></label>
            </div>
            <label><span>Email</span><input type="email" name="email" required /></label>
            <label><span>Password</span><input type="password" name="password" minlength="8" required /></label>
            <label><span>I am a</span>
              <select name="gender" required>
                <option value="man">Man</option>
                <option value="woman">Woman</option>
              </select>
            </label>
            <button class="lys-button lys-button-full" type="submit">Create account</button>
          </form>
        </section>
      </div>
    </div>

    <div class="lys-profile-detail-screen" data-profile-detail-screen hidden>
      <div class="lys-profile-detail-card" role="dialog" aria-modal="true" aria-label="Profile details">
        <button class="lys-auth-close" type="button" data-profile-detail-close>Close</button>
        <div class="lys-profile-detail-photo"><img data-detail-photo alt="" /></div>
        <div class="lys-profile-detail-content">
          <div class="lys-profile-detail-heading">
            <div><p class="lys-profile-kicker" data-detail-location></p><h2 data-detail-name></h2></div>
            <span class="lys-intent-badge" data-detail-intent></span>
          </div>
          <p class="lys-profile-quote" data-detail-quote></p>
          <div class="lys-interest-row" data-detail-interests></div>
          <div class="lys-profile-detail-about">
            <div><span class="lys-detail-label">About</span><p data-detail-about></p></div>
            <button class="lys-audio-button" type="button" data-detail-audio>
              <span class="lys-audio-icon">Play</span>
              <span><strong data-detail-audio-title>Hear their hello</strong><small data-detail-audio-time>Voice intro</small></span>
            </button>
          </div>
          <div class="lys-profile-actions">
            <button class="lys-button lys-button-ghost" type="button" data-detail-not-now>Not now</button>
            <button class="lys-button" type="button" data-detail-connect>Connect Now</button>
          </div>
        </div>
      </div>
    </div>

    <div class="lys-archive-screen" data-archive-screen hidden>
      <div class="lys-archive-card" role="dialog" aria-modal="true" aria-labelledby="lys-archive-title">
        <button class="lys-auth-close" type="button" data-archive-close>Close</button>
        <p class="lys-eyebrow">Not now</p>
        <h2 id="lys-archive-title">Your Archive</h2>
        <p class="lys-archive-lede">People you passed for now live here. Restore anyone to put them back into Discover.</p>
        <div data-archive-list></div>
      </div>
    </div>
  `)

  root.insertAdjacentHTML("beforeend", `
    <div class="lys-profile-edit-screen" data-profile-edit-screen hidden>
      <div class="lys-auth-card lys-profile-edit-card" role="dialog" aria-modal="true" aria-labelledby="lys-profile-edit-title">
        <button class="lys-auth-close" type="button" data-profile-edit-close>Close</button>
        <p class="lys-eyebrow">My profile</p>
        <h2 id="lys-profile-edit-title">Edit your profile.</h2>
        <form data-profile-edit-form>
          <div class="lys-auth-name-grid">
            <label><span>First name</span><input type="text" name="first_name" required /></label>
            <label><span>Last name</span><input type="text" name="last_name" required /></label>
          </div>
          <div class="lys-auth-name-grid">
            <label><span>City</span><input type="text" name="city" /></label>
            <label><span>State</span><input type="text" name="state" /></label>
          </div>
          <label><span>About me</span><textarea name="bio" rows="5" placeholder="Tell people a little about yourself."></textarea></label>
          <label>
            <span>Profile photo</span>
            <input type="file" name="profile_image_file" accept="image/*" />
            <small>Choose an image from your computer. JPG, PNG, GIF, or WebP up to 2 MB.</small>
          </label>
          <div class="lys-profile-edit-intents">
            <label><input type="checkbox" name="looking_for_friendship" /><span>Open to friendship</span></label>
            <label><input type="checkbox" name="looking_for_romance" /><span>Open to dating</span></label>
          </div>
          <button class="lys-button lys-button-full" type="submit">Save profile</button>
        </form>
      </div>
    </div>
  `)

  const authScreen = root.querySelector("[data-auth-screen]")
  const detailScreen = root.querySelector("[data-profile-detail-screen]")
  const archiveScreen = root.querySelector("[data-archive-screen]")
  const profileEditScreen = root.querySelector("[data-profile-edit-screen]")

  const topMemberButton = root.querySelector(".lys-welcome [data-enter-app]")
  if (topMemberButton) topMemberButton.textContent = "Sign in"

  const discoverIntro = root.querySelector(".lys-discover-intro")
  if (discoverIntro) {
    discoverIntro.insertAdjacentHTML("beforeend", `
      <button class="lys-archive-trigger" type="button" data-open-archive>
        <span>Archive</span><strong data-archive-count>0</strong>
      </button>
      <p class="lys-swipe-hint">Swipe right to connect. Swipe left for Not now.</p>
    `)
  }

  profileCards.forEach((card) => {
    const photo = card.querySelector(".lys-profile-photo-wrap")
    if (photo && !photo.querySelector(".lys-photo-cue")) {
      photo.insertAdjacentHTML("beforeend", '<span class="lys-photo-cue">Tap for profile + voice</span>')
    }
  })

  function setAuthTab(tab) {
    root.querySelectorAll("[data-auth-tab]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.authTab === tab)
    })
    root.querySelectorAll("[data-auth-pane]").forEach((pane) => {
      pane.hidden = pane.dataset.authPane !== tab
    })
  }

  function openAuth(tab) {
    if (!authScreen) return
    setAuthTab(tab || "signin")
    authScreen.hidden = false
    document.body.classList.add("lys-modal-open")
    const firstInput = authScreen.querySelector(`[data-auth-pane="${tab || "signin"}"] input`)
    if (firstInput) window.setTimeout(() => firstInput.focus(), 60)
  }

  function closeAuth() {
    if (!authScreen) return
    authScreen.hidden = true
    document.body.classList.remove("lys-modal-open")
  }

  function openProfileDetail(card) {
    if (!detailScreen || !card) return
    detailCard = card
    const name = profileName(card)
    const photo = card.querySelector(".lys-profile-photo")
    const location = card.querySelector(".lys-profile-kicker")
    const heading = card.querySelector(".lys-profile-heading h2")
    const quote = card.querySelector(".lys-profile-quote")
    const interests = card.querySelector(".lys-interest-row")
    const about = card.querySelector(".lys-profile-details p")
    const intent = card.dataset.intent === "romance" ? "Dating" : "Friendship"

    const detailPhoto = detailScreen.querySelector("[data-detail-photo]")
    if (detailPhoto && photo) {
      detailPhoto.src = photo.src
      detailPhoto.alt = photo.alt
    }
    const detailLocation = detailScreen.querySelector("[data-detail-location]")
    const detailName = detailScreen.querySelector("[data-detail-name]")
    const detailQuote = detailScreen.querySelector("[data-detail-quote]")
    const detailInterests = detailScreen.querySelector("[data-detail-interests]")
    const detailAbout = detailScreen.querySelector("[data-detail-about]")
    const detailIntent = detailScreen.querySelector("[data-detail-intent]")
    const detailAudioTitle = detailScreen.querySelector("[data-detail-audio-title]")
    const detailAudioTime = detailScreen.querySelector("[data-detail-audio-time]")
    const detailConnect = detailScreen.querySelector("[data-detail-connect]")

    if (detailLocation) detailLocation.textContent = location ? location.textContent : ""
    if (detailName) detailName.textContent = heading ? heading.textContent : name
    if (detailQuote) detailQuote.textContent = quote ? quote.textContent : ""
    if (detailInterests) detailInterests.innerHTML = interests ? interests.innerHTML : ""
    if (detailAbout) detailAbout.textContent = about ? about.textContent : `${name} has shared interests with you. Open the conversation naturally and see where the connection goes.`
    if (detailIntent) {
      detailIntent.textContent = intent
      detailIntent.classList.toggle("lys-intent-badge-romance", card.dataset.intent === "romance")
    }
    if (detailAudioTitle) detailAudioTitle.textContent = `Listen to ${name}'s hello`
    if (detailAudioTime) detailAudioTime.textContent = voiceByName[name] || "Voice intro"
    if (detailConnect) detailConnect.textContent = card.dataset.intent === "romance" ? "I'm Interested" : "Connect Now"

    detailScreen.hidden = false
    document.body.classList.add("lys-modal-open")
  }

  function closeProfileDetail() {
    if (!detailScreen) return
    detailScreen.hidden = true
    detailCard = null
    document.body.classList.remove("lys-modal-open")
  }

  function renderArchive() {
    const list = root.querySelector("[data-archive-list]")
    if (!list) return
    if (archived.size === 0) {
      list.innerHTML = '<p class="lys-archive-empty">Your Archive is empty.</p>'
      return
    }

    list.innerHTML = Array.from(archived).map((name) => {
      const card = profileCards.find((profile) => profileName(profile) === name)
      const photo = card && card.querySelector(".lys-profile-photo")
      const location = card && card.querySelector(".lys-profile-kicker")
      return `
        <article class="lys-archive-row">
          ${photo ? `<img src="${photo.src}" alt="${photo.alt}">` : ""}
          <div><strong>${name}</strong><span>${location ? location.textContent : ""}</span></div>
          <button type="button" class="lys-button lys-button-ghost lys-button-small" data-restore-profile="${name}">Restore</button>
        </article>
      `
    }).join("")
  }

  function openArchive() {
    if (!archiveScreen) return
    renderArchive()
    archiveScreen.hidden = false
    document.body.classList.add("lys-modal-open")
  }

  function closeArchive() {
    if (!archiveScreen) return
    archiveScreen.hidden = true
    document.body.classList.remove("lys-modal-open")
  }

  function restoreProfile(name) {
    archived.delete(name)
    saveArchived()
    updateArchiveCount()
    renderArchive()
    applyPoolFilter(activePool)
    showToast(`${name} restored to Discover.`)
  }

  root.addEventListener("click", (event) => {
    const target = event.target
    if (!(target instanceof Element)) return

    const landingEntry = target.closest(".lys-welcome [data-enter-app]")
    if (landingEntry) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      openAuth("signin")
      return
    }

    const signupEntry = target.closest("[data-open-signup]")
    if (signupEntry) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      openAuth("signup")
      return
    }

    const poolButton = target.closest("[data-pool]")
    if (poolButton) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      applyPoolFilter(poolButton.dataset.pool)
      return
    }

    const passButton = target.closest("[data-pass]")
    if (passButton) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      archiveCard(passButton.closest("[data-profile]"))
      return
    }

    const connectButton = target.closest("[data-connect]")
    if (connectButton) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      connectCard(connectButton.closest("[data-profile]"))
    }
  }, true)

  root.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.addEventListener("click", () => setAuthTab(button.dataset.authTab))
  })

  root.querySelector("[data-auth-close]")?.addEventListener("click", closeAuth)
  root.querySelector("[data-profile-detail-close]")?.addEventListener("click", closeProfileDetail)
  root.querySelector("[data-archive-close]")?.addEventListener("click", closeArchive)
  root.querySelector("[data-open-archive]")?.addEventListener("click", openArchive)
  root.querySelectorAll("[data-edit-profile]").forEach((button) => {
    button.addEventListener("click", () => openProfileEditor(false))
  })
  root.querySelector("[data-edit-profile-photo]")?.addEventListener("click", () => openProfileEditor(true))
  root.querySelector("[data-profile-edit-close]")?.addEventListener("click", closeProfileEditor)

  authScreen?.addEventListener("click", (event) => {
    if (event.target === authScreen) closeAuth()
  })
  detailScreen?.addEventListener("click", (event) => {
    if (event.target === detailScreen) closeProfileDetail()
  })
  archiveScreen?.addEventListener("click", (event) => {
    if (event.target === archiveScreen) closeArchive()
  })
  profileEditScreen?.addEventListener("click", (event) => {
    if (event.target === profileEditScreen) closeProfileEditor()
  })

  root.querySelector("[data-profile-edit-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const button = form.querySelector("button[type='submit']")

    if (!currentProfile) {
      currentProfile = await loadCurrentProfile()
    }
    if (!currentProfile) {
      showToast("Please sign in again before editing your profile.")
      return
    }

    if (button) {
      button.disabled = true
      button.textContent = "Saving..."
    }

    try {
      let profileImage = currentProfile.profile_image_url || ""
      const imageFile = form.elements.profile_image_file.files[0]

      if (imageFile) {
        if (!imageFile.type.startsWith("image/")) {
          throw new Error("Please choose an image file.")
        }

        if (imageFile.size > 2 * 1024 * 1024) {
          throw new Error("Please choose an image smaller than 2 MB.")
        }

        profileImage = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = () => reject(new Error("Unable to read that image."))
          reader.readAsDataURL(imageFile)
        })
      }

      const data = await apiRequest(`/api/users/${currentProfile.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          user: {
            first_name: form.elements.first_name.value.trim(),
            last_name: form.elements.last_name.value.trim(),
            city: form.elements.city.value.trim(),
            state: form.elements.state.value.trim(),
            bio: form.elements.bio.value.trim(),
            profile_image_url: profileImage,
            looking_for_friendship: form.elements.looking_for_friendship.checked,
            looking_for_romance: form.elements.looking_for_romance.checked
          }
        })
      })

      renderCurrentProfile(data.user)
      closeProfileEditor()
      showToast("Profile saved.")
    } catch (error) {
      showToast(error.message)
    } finally {
      if (button) {
        button.disabled = false
        button.textContent = "Save profile"
      }
    }
  })

  root.querySelector("[data-signin-preview]")?.addEventListener("submit", async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const button = form.querySelector("button[type='submit']")
    const email = form.querySelector("[name='email']")?.value.trim() || ""
    const password = form.querySelector("[name='password']")?.value || ""

    if (button) {
      button.disabled = true
      button.textContent = "Signing in..."
    }

    try {
      const data = await apiRequest("/api/session", {
        method: "POST",
        body: JSON.stringify({ email, password })
      })

      enterApp(data.user.first_name, data.user.gender)
      showToast(`Welcome back, ${data.user.first_name}.`)
    } catch (error) {
      showToast(error.message)
    } finally {
      if (button) {
        button.disabled = false
        button.textContent = "Sign in"
      }
    }
  })

  root.querySelector("[data-signup-preview]")?.addEventListener("submit", async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const button = form.querySelector("button[type='submit']")
    const firstName = form.querySelector("[name='first_name']")?.value.trim() || ""
    const lastName = form.querySelector("[name='last_name']")?.value.trim() || ""
    const email = form.querySelector("[name='email']")?.value.trim() || ""
    const password = form.querySelector("[name='password']")?.value || ""
    const gender = form.querySelector("[name='gender']")?.value || "man"

    if (button) {
      button.disabled = true
      button.textContent = "Creating account..."
    }

    try {
      const data = await apiRequest("/api/signup", {
        method: "POST",
        body: JSON.stringify({
          user: {
            first_name: firstName,
            last_name: lastName,
            email,
            password,
            password_confirmation: password,
            gender,
            looking_for_friendship: true,
            looking_for_romance: true
          }
        })
      })

      enterApp(data.user.first_name, data.user.gender)
      showToast(`Welcome, ${data.user.first_name}. Your account is ready.`)
    } catch (error) {
      showToast(error.message)
    } finally {
      if (button) {
        button.disabled = false
        button.textContent = "Create account"
      }
    }
  })

  root.querySelector("[data-detail-audio]")?.addEventListener("click", (event) => {
    const button = event.currentTarget
    const icon = button.querySelector(".lys-audio-icon")
    const isPlaying = button.classList.toggle("is-playing")
    if (icon) icon.textContent = isPlaying ? "Pause" : "Play"
    showToast(isPlaying ? `Playing ${profileName(detailCard)}'s voice intro preview.` : "Voice intro paused.")
  })

  root.querySelector("[data-detail-not-now]")?.addEventListener("click", () => {
    const card = detailCard
    closeProfileDetail()
    archiveCard(card)
  })

  root.querySelector("[data-detail-connect]")?.addEventListener("click", () => {
    const card = detailCard
    closeProfileDetail()
    connectCard(card)
  })

  root.querySelector("[data-archive-list]")?.addEventListener("click", (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const restore = target.closest("[data-restore-profile]")
    if (restore) restoreProfile(restore.dataset.restoreProfile)
  })

  profileCards.forEach((card) => {
    const photoWrap = card.querySelector(".lys-profile-photo-wrap")
    if (!photoWrap) return

    let startX = 0
    let startY = 0
    let deltaX = 0
    let deltaY = 0
    let dragging = false

    photoWrap.addEventListener("pointerdown", (event) => {
      startX = event.clientX
      startY = event.clientY
      deltaX = 0
      deltaY = 0
      dragging = false
      card.style.transition = "none"
      if (photoWrap.setPointerCapture) photoWrap.setPointerCapture(event.pointerId)
    })

    photoWrap.addEventListener("pointermove", (event) => {
      deltaX = event.clientX - startX
      deltaY = event.clientY - startY
      if (Math.abs(deltaX) > 12 && Math.abs(deltaX) > Math.abs(deltaY)) {
        dragging = true
        card.classList.toggle("is-swiping-right", deltaX > 0)
        card.classList.toggle("is-swiping-left", deltaX < 0)
        card.style.transform = `translateX(${deltaX}px) rotate(${deltaX / 45}deg)`
        card.style.opacity = String(Math.max(0.72, 1 - Math.abs(deltaX) / 700))
      }
    })

    photoWrap.addEventListener("pointerup", () => {
      card.classList.remove("is-swiping-right", "is-swiping-left")
      card.style.transition = "transform 180ms ease, opacity 180ms ease"

      if (dragging && Math.abs(deltaX) >= 105 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) connectCard(card)
        else archiveCard(card)
        return
      }

      card.style.transform = ""
      card.style.opacity = ""
      if (!dragging && Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) openProfileDetail(card)
    })

    photoWrap.addEventListener("pointercancel", () => {
      card.classList.remove("is-swiping-right", "is-swiping-left")
      card.style.transition = "transform 180ms ease, opacity 180ms ease"
      card.style.transform = ""
      card.style.opacity = ""
    })
  })

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return
    if (authScreen && !authScreen.hidden) closeAuth()
    if (detailScreen && !detailScreen.hidden) closeProfileDetail()
    if (archiveScreen && !archiveScreen.hidden) closeArchive()
    if (profileEditScreen && !profileEditScreen.hidden) closeProfileEditor()
  })

  const signedIn = window.sessionStorage.getItem("lysPrototypeSignedIn") === "true"
  if (!signedIn) {
    if (appShell) appShell.hidden = true
    if (welcome) welcome.hidden = false
    window.history.replaceState(null, "", window.location.pathname)
  } else {
    root.dataset.currentGender = window.sessionStorage.getItem("lysCurrentGender") || "man"
    applyPoolFilter(activePool)
    loadCurrentProfile()
  }

  updateArchiveCount()
}

document.addEventListener("turbolinks:load", initLYSEnhancements)
