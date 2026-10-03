import Swal from 'sweetalert2'

// Every alert / confirmation / notice in XERQO goes through SweetAlert2 (styled in index.css).
const base = Swal.mixin({
  buttonsStyling: false,
  reverseButtons: true,
  customClass: { confirmButton: 'xq-swal-btn xq-swal-confirm', cancelButton: 'xq-swal-btn xq-swal-cancel' },
})

const toastMixin = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  didOpen: (el) => {
    el.addEventListener('mouseenter', Swal.stopTimer)
    el.addEventListener('mouseleave', Swal.resumeTimer)
  },
})

// Small corner notices for routine feedback ("Saved", "Added to cart")
export const toast = {
  success: (title) => toastMixin.fire({ icon: 'success', title }),
  error: (title) => toastMixin.fire({ icon: 'error', title, timer: 6000 }),
  info: (title) => toastMixin.fire({ icon: 'info', title }),
}

// Full alerts for things the user must read
export const alertSuccess = (title, text) => base.fire({ icon: 'success', title, text, confirmButtonText: 'OK' })
export const alertError = (title, text) => base.fire({ icon: 'error', title, text, confirmButtonText: 'OK' })

/**
 * Ask before doing something. Resolves true when confirmed.
 * confirm({ title: 'Delete product?', text: '…', confirmText: 'Delete', danger: true })
 */
export async function confirm({ title, text, html, confirmText = 'Yes, continue', cancelText = 'Cancel', danger = false, icon } = {}) {
  const res = await base.fire({
    icon: icon ?? (danger ? 'warning' : 'question'),
    title,
    text,
    html,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    focusCancel: danger,
    customClass: { confirmButton: `xq-swal-btn ${danger ? 'xq-swal-danger' : 'xq-swal-confirm'}`, cancelButton: 'xq-swal-btn xq-swal-cancel' },
  })
  return res.isConfirmed
}

/**
 * Confirm, then run an async action with a loading state inside the dialog.
 * Resolves the action's result, or null when cancelled. Errors are shown in the dialog.
 */
export async function confirmAndRun({ title, text, confirmText = 'Yes, continue', danger = false }, action) {
  const res = await base.fire({
    icon: danger ? 'warning' : 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
    focusCancel: danger,
    showLoaderOnConfirm: true,
    allowOutsideClick: () => !Swal.isLoading(),
    customClass: { confirmButton: `xq-swal-btn ${danger ? 'xq-swal-danger' : 'xq-swal-confirm'}`, cancelButton: 'xq-swal-btn xq-swal-cancel' },
    preConfirm: async () => {
      try { return await action() } catch (e) { Swal.showValidationMessage(e?.message || 'Something went wrong.'); return false }
    },
  })
  return res.isConfirmed ? res.value : null
}

/**
 * Ask for one value (phone, email, reason…), then run an async action with it inside the dialog.
 * Resolves the action's result, or null when cancelled. Errors are shown under the input.
 */
export async function promptAndRun({ title, text, input = 'text', inputLabel, placeholder, value = '', confirmText = 'Continue', inputAttributes }, action) {
  const res = await base.fire({
    icon: 'question',
    title,
    text,
    input,
    inputLabel,
    inputPlaceholder: placeholder,
    inputValue: value,
    inputAttributes,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
    showLoaderOnConfirm: true,
    allowOutsideClick: () => !Swal.isLoading(),
    preConfirm: async (val) => {
      if (!String(val ?? '').trim()) { Swal.showValidationMessage('Please fill this in.'); return false }
      try { return await action(String(val).trim()) } catch (e) { Swal.showValidationMessage(e?.message || 'Something went wrong.'); return false }
    },
  })
  return res.isConfirmed ? res.value : null
}
