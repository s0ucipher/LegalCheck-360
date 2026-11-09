/**
 * ============================================================================
 * LegalCheck 360: Admin Legal Rules Management (Vanilla JS)
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  setupRuleModal();
  await loadAdminRules();
});

async function loadAdminRules() {
  try {
    const res = await API.getRules();
    const tbody = document.getElementById('admin-rules-tbody');
    if (!tbody) return;

    if (res.success && res.data) {
      tbody.innerHTML = '';
      res.data.forEach(rule => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td data-label="Rule ID"><strong>${rule.rule_id}</strong></td>
          <td data-label="Requirement">
            <div style="font-weight: 600; color: #f9fafb;">${rule.rule_name}</div>
            <div style="font-size: 0.8rem; color: #9ca3af; margin-top: 2px;">${rule.requirement}</div>
          </td>
          <td data-label="Citation"><span style="font-size: 0.8rem; color: #60a5fa;">${rule.legal_reference}</span></td>
          <td data-label="Category"><span class="badge badge-neutral">${rule.category}</span></td>
          <td data-label="Verified"><span style="font-size: 0.8rem; color: #9ca3af;">${rule.verified_at}</span></td>
          <td data-label="Status">
            <label class="switch">
              <input type="checkbox" ${rule.active_status === 1 ? 'checked' : ''} onchange="toggleRuleStatus('${rule.rule_id}')">
              <span class="slider"></span>
            </label>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error('Error loading rules:', err);
    showToast('Failed to load legal rules.', 'error');
  }
}

window.toggleRuleStatus = async function(ruleId) {
  try {
    const res = await API.toggleRule(ruleId);
    if (res.success) {
      showToast(`Rule ${ruleId} status updated successfully.`, 'success');
    } else {
      showToast(res.error || 'Failed to update rule status.', 'error');
    }
  } catch (err) {
    console.error('Toggle error:', err);
    showToast('Network error while toggling rule.', 'error');
  }
};

function setupRuleModal() {
  const modal = document.getElementById('add-rule-modal');
  const openBtn = document.getElementById('open-add-rule-btn');
  const closeBtn = document.getElementById('close-rule-modal-btn');
  const form = document.getElementById('add-rule-form');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => modal.style.display = 'flex');
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const newRule = {
        rule_id: document.getElementById('modal-rule-id').value.trim(),
        rule_name: document.getElementById('modal-rule-name').value.trim(),
        category: document.getElementById('modal-category').value,
        requirement: document.getElementById('modal-requirement').value.trim(),
        legal_reference: document.getElementById('modal-reference').value.trim(),
        effective_from: '2026-01-01',
        source_url: 'https://consumeraffairs.nic.in',
        verified_at: '2026-01-15',
        active_status: 1
      };

      try {
        const res = await API.addRule(newRule);
        if (res.success) {
          showToast('New Legal Metrology rule added.', 'success');
          modal.style.display = 'none';
          form.reset();
          await loadAdminRules();
        } else {
          showToast(res.error || 'Failed to add rule.', 'error');
        }
      } catch (err) {
        showToast('Error saving statutory rule.', 'error');
      }
    });
  }
}

