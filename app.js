document.addEventListener('DOMContentLoaded', () => {
  const eventTitle = document.querySelector('#event-title');
  const eventDescription = document.querySelector('#event-description');
  const aboutDescription = document.querySelector('#about-description');
  const aboutContact = document.querySelector('#about-contact');
  const scheduleList = document.querySelector('#schedule-list');
  const speakerList = document.querySelector('#speaker-list');
  const form = document.querySelector('#registration-form');
  const formStatus = document.querySelector('#form-status');

  const api = {
    event: '/api/event',
    schedule: '/api/schedule',
    speakers: '/api/speakers',
    register: '/api/register'
  };

  const setStatus = (message, isError = false) => {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.style.color = isError ? '#fca5a5' : '#7dd3fc';
  };

  fetch(api.event)
    .then(res => res.ok ? res.json() : Promise.reject(res))
    .then(data => {
      if (eventTitle) {
        eventTitle.textContent = `Welcome to ${data.name}`;
      }
      if (eventDescription) {
        eventDescription.textContent = data.description;
      }
      if (aboutDescription) {
        aboutDescription.textContent = data.description;
      }
      if (aboutContact) {
        aboutContact.textContent = `Email: ${data.contact}`;
      }
    })
    .catch(() => {
      if (eventTitle) eventTitle.textContent = 'Welcome to Tech Event 2026';
    });

  if (scheduleList) {
    fetch(api.schedule)
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        scheduleList.innerHTML = data.map(item => `
          <li>
            <strong>${item.track}</strong> - ${item.time}<br>
            ${item.description}
          </li>
        `).join('');
      })
      .catch(() => {
        scheduleList.innerHTML = '<li>Schedule unavailable right now.</li>';
      });
  }

  if (speakerList) {
    fetch(api.speakers)
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        speakerList.innerHTML = data.map(speaker => `
          <li>
            <strong>${speaker.name}</strong><br>
            ${speaker.expertise} at ${speaker.company}
          </li>
        `).join('');
      })
      .catch(() => {
        speakerList.innerHTML = '<li>Speakers unavailable right now.</li>';
      });
  }

  const qrContainer = document.getElementById('qr-code');
  if (qrContainer && window.QRCode && typeof window.QRCode.toCanvas === 'function') {
    const canvas = document.createElement('canvas');
    qrContainer.appendChild(canvas);
    window.QRCode.toCanvas(canvas, window.location.href, error => {
      if (error) console.error(error);
    });
  }

  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      setStatus('Submitting...');

      const formData = new FormData(form);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        domain: formData.get('domain')
      };

      fetch(api.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(async res => {
          const contentType = res.headers.get('content-type') || '';
          const payload = contentType.includes('application/json')
            ? await res.json()
            : { message: await res.text() };

          if (!res.ok) {
            throw new Error(payload.message || 'Registration failed.');
          }

          return payload;
        })
        .then(result => {
          setStatus(result.message || 'Registration successful!');
          form.reset();
        })
        .catch(error => {
          setStatus(error.message || 'Registration failed. Please try again.', true);
        });
    });
  }
});
