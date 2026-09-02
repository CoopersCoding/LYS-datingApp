function initLYSPointerGuard() {
  const root = document.querySelector("[data-lys-root]")
  if (!root || root.dataset.pointerGuardInitialized === "true") return

  root.dataset.pointerGuardInitialized = "true"

  document.addEventListener("pointermove", (event) => {
    const target = event.target
    if (!(target instanceof Element)) return

    const photoWrap = target.closest(".lys-profile-photo-wrap")
    if (!photoWrap || !root.contains(photoWrap)) return

    // On desktop, hovering over a profile photo sends pointermove events even
    // when the mouse is not pressed. The swipe handler should only see mouse
    // movement while an actual drag is in progress.
    if (event.pointerType === "mouse" && event.buttons === 0) {
      event.stopPropagation()
    }
  }, true)
}

document.addEventListener("turbolinks:load", initLYSPointerGuard)
