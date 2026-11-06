import { fieldLimits, normalisePublicUrl, serviceValues } from '../lib/enquiry';

/** Native POST remains available; enhancement preserves data on recoverable failures. */
export function setupReviewForm() {
  const form = document.querySelector<HTMLFormElement>('[data-review-form]');
  if (!form) return;
  const select = form.querySelector<HTMLSelectElement>('#service');
  const service = new URL(window.location.href).searchParams.get('service');
  if (select && serviceValues.includes(service as (typeof serviceValues)[number]))
    select.value = service!;
  const fields = [
    ...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input:not([type="hidden"]):not([name="bot-field"]), textarea, select',
    ),
  ];
  const status = form.querySelector<HTMLElement>('.form-status')!;
  const button = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
  const key = form.querySelector<HTMLInputElement>('[name="submission-id"]')!;
  let sending = false;
  let lastPayload = '';
  const message = (text: string) => {
    status.hidden = false;
    status.textContent = text;
    status.focus();
  };
  const validate = (
    field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    show: boolean,
  ) => {
    field.setCustomValidity('');
    if (field.required && !field.value.trim())
      field.setCustomValidity('Please complete this field.');
    if (field.value.length > (fieldLimits[field.name as keyof typeof fieldLimits] || 200))
      field.setCustomValidity('Please shorten this field.');
    if (field.type === 'url' && field.value.trim()) {
      try {
        field.value = normalisePublicUrl(field.value);
      } catch {
        field.setCustomValidity(
          'Enter a public http or https website address, or leave this field empty.',
        );
      }
    }
    const error = document.getElementById(`${field.id}-error`);
    if (show && error) {
      error.textContent = field.validity.valid
        ? ''
        : field.validity.typeMismatch && field.type === 'email'
          ? 'Enter a valid email address, such as name@example.co.uk.'
          : field.validationMessage;
      field.setAttribute('aria-invalid', String(!field.validity.valid));
    }
  };
  for (const field of fields) {
    field.addEventListener('input', () => {
      // Do not normalise a partially typed URL under the user's cursor.
      field.setCustomValidity('');
      if (field.hasAttribute('aria-invalid')) {
        field.removeAttribute('aria-invalid');
        const error = document.getElementById(`${field.id}-error`);
        if (error) error.textContent = '';
      }
    });
    field.addEventListener('blur', () =>
      validate(field, field.value.length > 0 || field.hasAttribute('aria-invalid')),
    );
  }
  form.noValidate = true;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;
    fields.forEach((field) => validate(field, true));
    if (!form.checkValidity()) {
      fields.find((field) => !field.validity.valid)?.focus();
      return;
    }
    if (form.dataset.hosted !== 'true') {
      message(
        'Enquiries are unavailable in this static preview. Nothing has been submitted. Please email contact@presencewebservices.co.uk.',
      );
      return;
    }
    const values: Record<string, string> = {};
    for (const input of form.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >('input[name],textarea[name],select[name]'))
      values[input.name] = input.value;
    delete values['submission-id'];
    const payload = JSON.stringify(values);
    if (!key.value || payload !== lastPayload) {
      key.value = crypto.randomUUID().replaceAll('-', '');
      lastPayload = payload;
    }
    values['submission-id'] = key.value;
    sending = true;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    status.hidden = false;
    status.textContent = 'Saving your request…';
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
        credentials: 'same-origin',
        signal: controller.signal,
      });
      const result = await response.json();
      if (response.ok && result.accepted === true && result.redirect === '/thank-you/') {
        window.location.assign('/thank-you/');
        return;
      }
      if (result.fields && typeof result.fields === 'object')
        for (const [name, text] of Object.entries(result.fields)) {
          const field = fields.find((item) => item.name === name);
          const error = document.getElementById(`${name}-error`);
          if (field && error && typeof text === 'string') {
            field.setAttribute('aria-invalid', 'true');
            error.textContent = text;
          }
        }
      message(
        typeof result.message === 'string'
          ? result.message
          : 'Your request could not be confirmed. Your details remain here. Please retry.',
      );
    } catch {
      message(
        'We could not confirm receipt. Your details remain in the form. Check your connection and try again. Retrying the same request will not create a duplicate.',
      );
    } finally {
      window.clearTimeout(timer);
      sending = false;
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  });
}
