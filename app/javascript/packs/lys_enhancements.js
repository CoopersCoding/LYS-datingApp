function initLYSEnhancements() {
  const root = document.querySelector("[data-lys-root]")
  if (!root || root.dataset.lysEnhancementsInitialized === "true") return

  root.dataset.lysEnhancementsInitialized = "true"

  const welcome = root.querySelector("[data-welcome-screen]")
  const appShell = root.querySelector("[data-app-shell]")
  const toast = root.querySelector("[data-toast]")
  const profileStream = root.querySelector("[data-profile-stream]")
  const profileCards = Array.from(root.querySelectorAll("[data-profile]"))
  const archived = new Set(JSON.parse(window.localStorage.getItem("lysArchivedProfiles") || "[]"))

  let currentProfile = null
  let availableInterests = []
  let activePool = "friendship"
  let detailCard = null
  let toastTimer = null
  let connectedNames = new Set()
  let discoverUsersByName = new Map()

  const genderByName = {
    Maya: "woman",
    Daniel: "man",
    Olivia: "woman",
    Marcus: "man",
    Mia: "woman",
    Noah: "man",
    Sofia: "woman",
    Ethan: "man",
    Ava: "woman",
    Lucas: "man",
    Grace: "woman",
    Owen: "man",
    Chloe: "woman",
    Natalie: "woman",
    Emma: "woman",
    Lauren: "woman",
    Rachel: "woman"
  }

  function csrfToken() {
    return document.querySelector("meta[name='csrf-token']")?.content || ""
  }

  function installCsrfToken(token) {
    if (!token) return

    const meta = document.querySelector("meta[name='csrf-token']")
    if (meta) meta.setAttribute("content", token)
  }

  async function apiRequest(path, options = {}) {
    const headers = Object.assign({ "Accept": "application/json" }, options.headers || {})
    if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json"
    if (options.method && options.method.toUpperCase() !== "GET" && csrfToken()) {
      headers["X-CSRF-Token"] = csrfToken()
    }

    const response = await fetch(path, Object.assign({}, options, {
      headers,
      credentials: "same-origin"
    }))
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = data.error || (data.errors && data.errors.join(", ")) || "Something went wrong."
      const error = new Error(message)
      error.status = response.status
      throw error
    }

    return data
  }

  function imageFileToProfileDataUrl(file) {
    if (!file.type.startsWith("image/")) {
      return Promise.reject(new Error("Please choose an image file."))
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onerror = () => reject(new Error("Unable to read that image."))

      reader.onload = () => {
        const originalDataUrl = reader.result

        if (file.type === "image/gif" || file.type === "image/svg+xml") {
          if (file.size > 2 * 1024 * 1024) {
            reject(new Error("Please choose a JPG, PNG, or WebP photo for large images."))
          } else {
            resolve(originalDataUrl)
          }
          return
        }

        const image = new Image()

        image.onerror = () => reject(new Error("Unable to process that image."))

        image.onload = () => {
          const maxDimension = 1200
          const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
          const width = Math.max(1, Math.round(image.naturalWidth * scale))
          const height = Math.max(1, Math.round(image.naturalHeight * scale))

          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height

          const context = canvas.getContext("2d")
          if (!context) {
            reject(new Error("Unable to process that image."))
            return
          }

          context.drawImage(image, 0, 0, width, height)

          let quality = 0.82
          let dataUrl = canvas.toDataURL("image/jpeg", quality)

          while (dataUrl.length > 1_500_000 && quality > 0.5) {
            quality -= 0.08
            dataUrl = canvas.toDataURL("image/jpeg", quality)
          }

          resolve(dataUrl)
        }

        image.src = originalDataUrl
      }

      reader.readAsDataURL(file)
    })
  }

  function showToast(message) {
    if (!toast) return
    window.clearTimeout(toastTimer)
    toast.textContent = message
    toast.hidden = false
    toastTimer = window.setTimeout(() => {
      toast.hidden = true
    }, 2600)
  }

  function profileName(card) {
    const heading = card?.querySelector(".lys-profile-heading h2")
    return heading ? heading.textContent.split(",")[0].trim() : ""
  }

  function currentGender() {
    return currentProfile?.gender || "man"
  }

  function romanticTargetGender() {
    return currentGender() === "woman" ? "man" : "woman"
  }

  function saveArchived() {
    window.localStorage.setItem("lysArchivedProfiles", JSON.stringify(Array.from(archived)))
  }

  function updateArchiveCount() {
    const count = root.querySelector("[data-archive-count]")
    if (count) count.textContent = String(archived.size)
  }

  profileCards.forEach((card) => {
    const name = profileName(card)
    card.dataset.gender = genderByName[name] || ""
  })

  root.insertAdjacentHTML("beforeend", `
    <div class="lys-auth-screen" data-auth-screen hidden>
      <div class="lys-auth-card" role="dialog" aria-modal="true" aria-labelledby="lys-auth-title">
        <button class="lys-auth-close" type="button" data-auth-close>Close</button>
        <div class="lys-auth-brand">
          <span class="lys-brand-mark">LYS</span>
          <div><strong>Last Year Single</strong><span>Friendship. Dating. Real connection.</span></div>
        </div>

        <div class="lys-auth-tabs" role="tablist" aria-label="Account access">
          <button type="button" class="is-active" data-auth-tab="signin">Sign in</button>
          <button type="button" data-auth-tab="signup">Sign up</button>
        </div>

        <section data-auth-pane="signin">
          <p class="lys-eyebrow">Welcome back</p>
          <h2 id="lys-auth-title">Sign in to your community.</h2>
          <form data-signin-form>
            <label><span>Email</span><input type="email" name="email" required /></label>
            <label><span>Password</span><input type="password" name="password" required /></label>
            <button class="lys-button lys-button-full" type="submit">Sign in</button>
          </form>
        </section>

        <section data-auth-pane="signup" hidden>
          <p class="lys-eyebrow">Join Last Year Single</p>
          <h2>Create your profile.</h2>
          <form data-signup-form-real>
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
            <small>Choose a photo from your device. Large photos are resized automatically.</small>
          </label>
          <div class="lys-profile-edit-intents">
            <label><input type="checkbox" name="looking_for_friendship" /><span>Open to friendship</span></label>
            <label><input type="checkbox" name="looking_for_romance" /><span>Open to dating</span></label>
          </div>
          <fieldset class="lys-interest-picker">
            <legend>Interests</legend>
            <div data-interest-options><span>Loading interests...</span></div>
          </fieldset>
          <button class="lys-button lys-button-full" type="submit">Save profile</button>
        </form>
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

  const authScreen = root.querySelector("[data-auth-screen]")
  const profileEditScreen = root.querySelector("[data-profile-edit-screen]")
  const detailScreen = root.querySelector("[data-profile-detail-screen]")
  const archiveScreen = root.querySelector("[data-archive-screen]")

  const discoverIntro = root.querySelector(".lys-discover-intro")
  if (discoverIntro && !root.querySelector("[data-open-archive]")) {
    discoverIntro.insertAdjacentHTML("beforeend", `
      <button class="lys-archive-trigger" type="button" data-open-archive>
        <span>Archive</span><strong data-archive-count>0</strong>
      </button>
      <p class="lys-swipe-hint">Swipe right to connect. Swipe left for Not now.</p>
    `)
  }

  function setAuthTab(tab) {
    root.querySelectorAll("[data-auth-tab]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.authTab === tab)
    })
    root.querySelectorAll("[data-auth-pane]").forEach((pane) => {
      pane.hidden = pane.dataset.authPane !== tab
    })
  }

  function openAuth(tab = "signin") {
    setAuthTab(tab)
    authScreen.hidden = false
    document.body.classList.add("lys-modal-open")
    authScreen.querySelector(`[data-auth-pane="${tab}"] input`)?.focus()
  }

  function closeAuth() {
    authScreen.hidden = true
    document.body.classList.remove("lys-modal-open")
  }

  function renderPreferences(user) {
    root.querySelectorAll("[data-preference-toggle]").forEach((button) => {
      const key = button.dataset.preference === "romance" ? "looking_for_romance" : "looking_for_friendship"
      const selected = Boolean(user[key])
      button.classList.toggle("is-selected", selected)
      const status = button.querySelector(":scope > span")
      if (status) status.textContent = selected ? "On" : "Off"
    })
  }

  function renderCurrentProfile(user) {
    currentProfile = user
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ")
    const location = [user.city, user.state].filter(Boolean).join(", ")

    root.querySelector("[data-current-profile-name]")?.replaceChildren(document.createTextNode(fullName || "Member"))
    root.querySelector("[data-current-profile-location]")?.replaceChildren(document.createTextNode(location || "Location not added"))
    root.querySelector("[data-current-profile-bio]")?.replaceChildren(document.createTextNode(user.bio || "Add a few words about yourself so people know what matters to you."))

    const photo = root.querySelector("[data-current-profile-photo]")
    if (photo && user.profile_image_url) photo.src = user.profile_image_url

    const chipName = root.querySelector(".lys-profile-chip-copy strong")
    if (chipName) chipName.textContent = user.first_name || "Member"

    const chipInitials = root.querySelector(".lys-profile-chip > span:first-child")
    if (chipInitials) {
      chipInitials.textContent = [user.first_name, user.last_name].filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "LY"
    }

    const interests = root.querySelector("[data-current-interests]")
    if (interests) {
      interests.innerHTML = user.interests?.length
        ? user.interests.map((interest) => `<span>${interest.name}</span>`).join("")
        : "<span>No interests selected yet.</span>"
    }

    renderPreferences(user)
  }

  async function loadCurrentProfile() {
    const data = await apiRequest("/api/me")
    renderCurrentProfile(data.user)
    return data.user
  }

  async function loadDiscoverState() {
    const [usersData, connectionsData] = await Promise.all([
      apiRequest("/api/users"),
      apiRequest("/api/connections")
    ])

    discoverUsersByName = new Map((usersData.users || []).map((user) => [user.first_name, user]))
    connectedNames = new Set((connectionsData.connections || []).map((connection) => connection.other_user.first_name))

    profileCards.forEach((card) => {
      const user = discoverUsersByName.get(profileName(card))
      if (user) card.dataset.userId = user.id
    })

    applyPoolFilter(activePool)
  }

  function applyPoolFilter(pool) {
    activePool = pool

    root.querySelectorAll("[data-pool]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.pool === pool)
    })

    profileCards.forEach((card) => {
      const name = profileName(card)
      const wrongLane = card.dataset.intent !== pool
      const wrongRomanticGender = pool === "romance" && card.dataset.gender !== romanticTargetGender()
      const unavailable = archived.has(name) || connectedNames.has(name)

      card.hidden = wrongLane || wrongRomanticGender || unavailable
      card.style.transform = ""
      card.style.opacity = ""
    })

    profileStream?.scrollTo({ top: 0, behavior: "smooth" })
  }

  function resetSwipeVisual(card) {
    if (!card) return
    card.classList.remove("is-swiping-right", "is-swiping-left")
    card.style.transition = "transform 180ms ease, opacity 180ms ease"
    card.style.transform = ""
    card.style.opacity = "1"
  }

  function animateCardOut(card, direction) {
    if (!card) return Promise.resolve()

    const right = direction === "right"
    card.classList.remove("is-swiping-right", "is-swiping-left")
    card.classList.add(right ? "is-swiping-right" : "is-swiping-left")
    card.style.transition = "transform 220ms ease, opacity 220ms ease"

    return new Promise((resolve) => {
      window.requestAnimationFrame(() => {
        card.style.transform = right
          ? "translateX(115%) rotate(5deg)"
          : "translateX(-115%) rotate(-5deg)"
        card.style.opacity = "0"

        window.setTimeout(resolve, 230)
      })
    })
  }

  async function archiveCard(card) {
    if (!card) return
    const name = profileName(card)

    await animateCardOut(card, "left")

    archived.add(name)
    saveArchived()
    updateArchiveCount()
    applyPoolFilter(activePool)
    showToast(`${name} moved to your Archive.`)
  }

  async function connectCard(card) {
    if (!card || !currentProfile) return

    const name = profileName(card)
    let targetId = card.dataset.userId

    if (!targetId) {
      await loadDiscoverState()
      targetId = card.dataset.userId
    }

    if (!targetId) {
      showToast("That profile is not available right now.")
      return
    }

    const button = card.querySelector("[data-connect]")
    if (button) {
      button.disabled = true
      button.textContent = "Sending..."
    }

    try {
      await apiRequest("/api/connections", {
        method: "POST",
        body: JSON.stringify({
          connection: {
            recipient_id: targetId,
            connection_type: card.dataset.intent === "romance" ? "romantic" : "friendship"
          }
        })
      })

      connectedNames.add(name)
      await animateCardOut(card, "right")
      applyPoolFilter(activePool)
      showToast(`Connection request sent to ${name}.`)
    } catch (error) {
      resetSwipeVisual(card)
      showToast(error.message)
      if (button) {
        button.disabled = false
        button.textContent = card.dataset.intent === "romance" ? "I'm Interested" : "Connect Now"
      }
    }
  }

  async function loadInterests() {
    if (availableInterests.length) return availableInterests
    const data = await apiRequest("/api/interests")
    availableInterests = data.interests || []
    return availableInterests
  }

  function renderInterestOptions(user) {
    const container = profileEditScreen.querySelector("[data-interest-options]")
    if (!container) return

    const selected = new Set((user.interests || []).map((interest) => Number(interest.id)))
    container.innerHTML = availableInterests.map((interest) => `
      <label>
        <input type="checkbox" name="interest_ids" value="${interest.id}" ${selected.has(Number(interest.id)) ? "checked" : ""} />
        <span>${interest.name}</span>
      </label>
    `).join("")
  }

  async function openProfileEditor(openFilePicker = false) {
    if (!currentProfile) return

    const form = profileEditScreen.querySelector("[data-profile-edit-form]")
    form.elements.first_name.value = currentProfile.first_name || ""
    form.elements.last_name.value = currentProfile.last_name || ""
    form.elements.city.value = currentProfile.city || ""
    form.elements.state.value = currentProfile.state || ""
    form.elements.bio.value = currentProfile.bio || ""
    form.elements.profile_image_file.value = ""
    form.elements.looking_for_friendship.checked = Boolean(currentProfile.looking_for_friendship)
    form.elements.looking_for_romance.checked = Boolean(currentProfile.looking_for_romance)

    profileEditScreen.hidden = false
    document.body.classList.add("lys-modal-open")

    if (openFilePicker) {
      form.elements.profile_image_file.click()
    } else {
      form.elements.bio.focus()
    }

    await loadInterests()
    renderInterestOptions(currentProfile)
  }

  function closeProfileEditor() {
    profileEditScreen.hidden = true
    document.body.classList.remove("lys-modal-open")
  }

  function openProfileDetail(card) {
    if (!card) return
    detailCard = card

    const name = profileName(card)
    const photo = card.querySelector(".lys-profile-photo")
    const intent = card.dataset.intent === "romance" ? "Dating" : "Friendship"

    const detailPhoto = detailScreen.querySelector("[data-detail-photo]")
    if (detailPhoto && photo) {
      detailPhoto.src = photo.src
      detailPhoto.alt = photo.alt
    }

    detailScreen.querySelector("[data-detail-location]").textContent = card.querySelector(".lys-profile-kicker")?.textContent || ""
    detailScreen.querySelector("[data-detail-name]").textContent = card.querySelector(".lys-profile-heading h2")?.textContent || name
    detailScreen.querySelector("[data-detail-quote]").textContent = card.querySelector(".lys-profile-quote")?.textContent || ""
    detailScreen.querySelector("[data-detail-interests]").innerHTML = card.querySelector(".lys-interest-row")?.innerHTML || ""
    detailScreen.querySelector("[data-detail-about]").textContent = card.querySelector(".lys-profile-details p")?.textContent || `Learn more about ${name} by connecting.`

    const badge = detailScreen.querySelector("[data-detail-intent]")
    badge.textContent = intent
    badge.classList.toggle("lys-intent-badge-romance", card.dataset.intent === "romance")

    const connect = detailScreen.querySelector("[data-detail-connect]")
    connect.textContent = card.dataset.intent === "romance" ? "I'm Interested" : "Connect Now"

    detailScreen.hidden = false
    document.body.classList.add("lys-modal-open")
  }

  function closeProfileDetail() {
    detailScreen.hidden = true
    detailCard = null
    document.body.classList.remove("lys-modal-open")
  }

  function renderArchive() {
    const list = archiveScreen.querySelector("[data-archive-list]")
    if (!list) return

    if (archived.size === 0) {
      list.innerHTML = '<p class="lys-archive-empty">Your Archive is empty.</p>'
      return
    }

    list.innerHTML = Array.from(archived).map((name) => `
      <article class="lys-archive-row">
        <div><strong>${name}</strong><span>Hidden from Discover for now.</span></div>
        <button type="button" class="lys-button lys-button-ghost lys-button-small" data-restore-profile="${name}">Restore</button>
      </article>
    `).join("")
  }

  function openArchive() {
    renderArchive()
    archiveScreen.hidden = false
    document.body.classList.add("lys-modal-open")
  }

  function closeArchive() {
    archiveScreen.hidden = true
    document.body.classList.remove("lys-modal-open")
  }

  async function enterApp(user) {
    renderCurrentProfile(user)

    await loadDiscoverState()
    closeAuth()

    const requested = window.location.hash.replace("#", "")
    const page = ["discover", "community", "messages", "profile"].includes(requested) ? requested : "discover"
    window.LYS?.showPage(page)

    document.dispatchEvent(new CustomEvent("lys:authchange", { detail: { signedIn: true } }))

    loadCurrentProfile().catch(() => {})
  }

  async function signOut() {
    try {
      await apiRequest("/api/session", { method: "DELETE" })
      window.location.assign("/")
    } catch (error) {
      showToast(error.message)
    }
  }

  root.addEventListener("click", async (event) => {
    const target = event.target
    if (!(target instanceof Element)) return

    const signInEntry = target.closest(".lys-welcome [data-enter-app]")
    if (signInEntry) {
      event.preventDefault()
      event.stopPropagation()
      openAuth("signin")
      return
    }

    const signupEntry = target.closest("[data-open-signup]")
    if (signupEntry) {
      event.preventDefault()
      event.stopPropagation()
      openAuth("signup")
      return
    }

    const pool = target.closest("[data-pool]")
    if (pool) {
      event.preventDefault()
      applyPoolFilter(pool.dataset.pool)
      return
    }

    const pass = target.closest("[data-pass]")
    if (pass) {
      event.preventDefault()
      archiveCard(pass.closest("[data-profile]"))
      return
    }

    const connect = target.closest("[data-connect]")
    if (connect) {
      event.preventDefault()
      await connectCard(connect.closest("[data-profile]"))
      return
    }

    const preference = target.closest("[data-preference-toggle]")
    if (preference && currentProfile) {
      event.preventDefault()
      const key = preference.dataset.preference === "romance" ? "looking_for_romance" : "looking_for_friendship"
      const data = await apiRequest(`/api/users/${currentProfile.id}`, {
        method: "PATCH",
        body: JSON.stringify({ user: { [key]: !currentProfile[key] } })
      })
      renderCurrentProfile(data.user)
      showToast("Preference saved.")
      return
    }

    const restore = target.closest("[data-restore-profile]")
    if (restore) {
      archived.delete(restore.dataset.restoreProfile)
      saveArchived()
      updateArchiveCount()
      renderArchive()
      applyPoolFilter(activePool)
    }
  })

  root.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.addEventListener("click", () => setAuthTab(button.dataset.authTab))
  })

  root.querySelector("[data-auth-close]")?.addEventListener("click", closeAuth)
  root.querySelector("[data-profile-edit-close]")?.addEventListener("click", closeProfileEditor)
  root.querySelector("[data-profile-detail-close]")?.addEventListener("click", closeProfileDetail)
  root.querySelector("[data-archive-close]")?.addEventListener("click", closeArchive)
  root.querySelector("[data-open-archive]")?.addEventListener("click", openArchive)
  root.querySelectorAll("[data-edit-profile]").forEach((button) => button.addEventListener("click", () => openProfileEditor(false)))
  root.querySelector("[data-edit-profile-photo]")?.addEventListener("click", () => openProfileEditor(true))
  root.querySelector("[data-signout]")?.addEventListener("click", signOut)

  authScreen.addEventListener("click", (event) => {
    if (event.target === authScreen) closeAuth()
  })
  profileEditScreen.addEventListener("click", (event) => {
    if (event.target === profileEditScreen) closeProfileEditor()
  })
  detailScreen.addEventListener("click", (event) => {
    if (event.target === detailScreen) closeProfileDetail()
  })
  archiveScreen.addEventListener("click", (event) => {
    if (event.target === archiveScreen) closeArchive()
  })

  root.querySelector("[data-signin-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const button = form.querySelector("button[type='submit']")
    button.disabled = true
    button.textContent = "Signing in..."

    try {
      const data = await apiRequest("/api/session", {
        method: "POST",
        body: JSON.stringify({
          email: form.elements.email.value.trim(),
          password: form.elements.password.value
        })
      })
      installCsrfToken(data.csrf_token)
      await enterApp(data.user)
      showToast(`Welcome back, ${data.user.first_name}.`)
    } catch (error) {
      showToast(error.message)
    } finally {
      button.disabled = false
      button.textContent = "Sign in"
    }
  })

  root.querySelector("[data-signup-form-real]")?.addEventListener("submit", async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const button = form.querySelector("button[type='submit']")
    button.disabled = true
    button.textContent = "Creating account..."

    try {
      const password = form.elements.password.value
      const data = await apiRequest("/api/signup", {
        method: "POST",
        body: JSON.stringify({
          user: {
            first_name: form.elements.first_name.value.trim(),
            last_name: form.elements.last_name.value.trim(),
            email: form.elements.email.value.trim(),
            password,
            password_confirmation: password,
            gender: form.elements.gender.value,
            looking_for_friendship: true,
            looking_for_romance: true
          }
        })
      })
      installCsrfToken(data.csrf_token)
      await enterApp(data.user)
      showToast(`Welcome, ${data.user.first_name}.`)
    } catch (error) {
      showToast(error.message)
    } finally {
      button.disabled = false
      button.textContent = "Create account"
    }
  })

  root.querySelector("[data-profile-edit-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault()
    if (!currentProfile) return

    const form = event.currentTarget
    const button = form.querySelector("button[type='submit']")
    button.disabled = true
    button.textContent = "Saving..."

    try {
      let profileImage = currentProfile.profile_image_url || ""
      const imageFile = form.elements.profile_image_file.files[0]

      if (imageFile) {
        profileImage = await imageFileToProfileDataUrl(imageFile)
      }

      const interestIds = Array.from(form.querySelectorAll('input[name="interest_ids"]:checked')).map((input) => input.value)

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
            looking_for_romance: form.elements.looking_for_romance.checked,
            interest_ids: interestIds
          }
        })
      })

      renderCurrentProfile(data.user)
      closeProfileEditor()
      showToast("Profile saved.")
    } catch (error) {
      showToast(error.message)
    } finally {
      button.disabled = false
      button.textContent = "Save profile"
    }
  })

  root.querySelector("[data-detail-not-now]")?.addEventListener("click", () => {
    const card = detailCard
    closeProfileDetail()
    archiveCard(card)
  })

  root.querySelector("[data-detail-connect]")?.addEventListener("click", async () => {
    const card = detailCard
    closeProfileDetail()
    await connectCard(card)
  })

  profileCards.forEach((card) => {
    const photoWrap = card.querySelector(".lys-profile-photo-wrap")
    if (!photoWrap) return

    photoWrap.addEventListener("click", (event) => {
      if (event.target.closest("button")) return
      openProfileDetail(card)
    })

    let startX = 0
    let startY = 0
    let currentX = 0
    let isHorizontalSwipe = false

    photoWrap.addEventListener("touchstart", (event) => {
      const touch = event.touches[0]
      startX = touch.clientX
      startY = touch.clientY
      currentX = startX
      isHorizontalSwipe = false

      card.style.transition = "none"
      card.style.opacity = "1"
      card.classList.remove("is-swiping-right", "is-swiping-left")
    }, { passive: true })

    photoWrap.addEventListener("touchmove", (event) => {
      const touch = event.touches[0]
      currentX = touch.clientX

      const deltaX = currentX - startX
      const deltaY = touch.clientY - startY

      if (!isHorizontalSwipe) {
        if (Math.abs(deltaX) < 10) return
        if (Math.abs(deltaY) > Math.abs(deltaX)) return
        isHorizontalSwipe = true
      }

      event.preventDefault()

      card.classList.toggle("is-swiping-right", deltaX > 0)
      card.classList.toggle("is-swiping-left", deltaX < 0)

      const dragX = deltaX * 0.78
      const rotation = Math.max(-7, Math.min(7, deltaX / 28))
      const fade = Math.min(0.28, Math.abs(deltaX) / 650)

      card.style.transform = `translateX(${dragX}px) rotate(${rotation}deg)`
      card.style.opacity = String(1 - fade)
    }, { passive: false })

    photoWrap.addEventListener("touchend", async (event) => {
      const touch = event.changedTouches[0]
      const deltaX = touch.clientX - startX
      const deltaY = touch.clientY - startY

      if (!isHorizontalSwipe || Math.abs(deltaX) < 90 || Math.abs(deltaX) < Math.abs(deltaY)) {
        resetSwipeVisual(card)
        return
      }

      if (deltaX > 0) {
        await connectCard(card)
      } else {
        await archiveCard(card)
      }
    }, { passive: true })

    photoWrap.addEventListener("touchcancel", () => {
      resetSwipeVisual(card)
    }, { passive: true })
  })

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return
    if (!authScreen.hidden) closeAuth()
    if (!profileEditScreen.hidden) closeProfileEditor()
    if (!detailScreen.hidden) closeProfileDetail()
    if (!archiveScreen.hidden) closeArchive()
  })

  async function initializeSession() {
    try {
      const user = await loadCurrentProfile()
      await loadDiscoverState()

      const requested = window.location.hash.replace("#", "")
      const page = ["discover", "community", "messages", "profile"].includes(requested) ? requested : "discover"
      window.LYS?.showPage(page, false)
      document.dispatchEvent(new CustomEvent("lys:authchange", { detail: { signedIn: true } }))
    } catch (_error) {
      if (appShell) appShell.hidden = true
      if (welcome) welcome.hidden = false
      window.history.replaceState(null, "", window.location.pathname)
    }

    updateArchiveCount()
  }

  document.addEventListener("lys:connectionschanged", async () => {
    try {
      await loadDiscoverState()
      showToast("Connection removed. They are back in Discover.")
    } catch (_error) {}
  })

  initializeSession()
}

document.addEventListener("turbolinks:load", initLYSEnhancements)
