document.addEventListener('DOMContentLoaded', () => {
  // Handle status updates
  document.querySelectorAll('.admin-actions form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const url = form.getAttribute('action');
      const method = form.querySelector('button').classList.contains('btn-delete') ? 'DELETE' : 'POST';

      try {
        const res = await fetch(url, { method });
        if (res.ok) {
          // For status update: just reload the page or update badge dynamically
          if (!form.querySelector('button').classList.contains('btn-delete')) {
            const badge = form.closest('.booking-item').querySelector('.booking-status span');
            const btn = form.querySelector('button');

            if (btn.classList.contains('btn-process')) {
              badge.textContent = 'Processing';
              badge.className = 'badge badge-processing';
              btn.textContent = 'Processed';
              btn.className = 'btn btn-complete';
              btn.closest('form').setAttribute('action', url.replace('processing', 'processed'));
            } else if (btn.classList.contains('btn-complete')) {
              badge.textContent = 'Processed';
              badge.className = 'badge badge-processed';
              btn.closest('.admin-actions').querySelector('form').remove(); // remove form after processed
            }
          } else {
            // Delete booking
            form.closest('.booking-item').remove();
          }
        } else {
          const data = await res.json();
          alert(data.message || 'Something went wrong.');
        }
      } catch (err) {
        console.error(err);
        alert('Server error. Please try again.');
      }
    });
  });
});
