<script setup lang="ts">
import { useGameState } from '../state/useGameState';

const { state, closeStatsModal } = useGameState();

function handleDismiss() {
  closeStatsModal();
}
</script>

<template>
  <transition name="pop-fade">
    <div v-if="state.showStatsModal" class="modal-backdrop" @click.self="handleDismiss">
      <div class="modal-dialog retro-scroll" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-left">
            <span class="warning-pulse">⚠</span>
            <span class="modal-title">CRISIS DOSSIER // REALITY CHECK</span>
          </div>
        </div>

        <!-- Scrollable Body -->
        <div class="modal-content">
          <div class="sub-header">
            <div class="headline">SINGAPORE REALITY CHECK</div>
            <div class="tagline">Official Central Narcotics Bureau (CNB) findings on local drug abuse.</div>
          </div>

          <!-- 4 Core Statistics Grid -->
          <div class="stats-grid">
            <!-- Stat 1: Youth Abusers -->
            <div class="stat-card">
              <div class="stat-badge danger-badge">CNB ANNUAL STATS</div>
              <div class="stat-value text-danger">>50%</div>
              <div class="stat-label">NEW ABUSERS UNDER 30</div>
              <p class="stat-desc">
                Over half of all newly arrested drug abusers in Singapore are youths under 30.
              </p>
              <div class="stat-source">Source: CNB Singapore Annual Statistics</div>
            </div>

            <!-- Stat 2: Early Onset -->
            <div class="stat-card">
              <div class="stat-badge warning-badge">YOUNGEST ARREST</div>
              <div class="stat-value text-warning">AGE 13</div>
              <div class="stat-label">EARLY ONSET TOLL</div>
              <p class="stat-desc">
                Youths arrested as young as 13, often lured by online misinformation and peers.
              </p>
              <div class="stat-source">Source: Central Narcotics Bureau SG</div>
            </div>

            <!-- Stat 3: Primary Substance -->
            <div class="stat-card">
              <div class="stat-badge alert-badge">MOST ABUSED</div>
              <div class="stat-value text-alert">#1 ICE</div>
              <div class="stat-label">METHAMPHETAMINE</div>
              <p class="stat-desc">
                Meth remains Singapore's most abused drug, causing psychosis and cardiac collapse.
              </p>
              <div class="stat-source">Source: CNB Enforcement Data</div>
            </div>

            <!-- Stat 4: Legal Consequences -->
            <div class="stat-card">
              <div class="stat-badge accent-badge">ZERO TOLERANCE</div>
              <div class="stat-value text-accent">STRICT MDA</div>
              <div class="stat-label">MISUSE OF DRUGS ACT</div>
              <p class="stat-desc">
                Trafficking and consumption carry mandatory caning, DRC detention, and severe records.
              </p>
              <div class="stat-source">Source: Singapore Misuse of Drugs Act</div>
            </div>
          </div>

          <!-- Takeaway Note -->
          <div class="takeaway-box">
            <div class="takeaway-title">CRISIS PERSPECTIVE:</div>
            <p class="takeaway-text">
              In Singapore, harm prevention is paramount. Early intervention, family vigilance, and professional support save lives before physical and legal ruin take hold.
            </p>
          </div>

          <!-- Helpline Banner -->
          <div class="helpline-banner">
            <div class="helpline-title">CONFIDENTIAL SINGAPORE HELPLINES:</div>
            <div class="helpline-grid">
              <div class="helpline-item">
                <span class="helpline-icon">📞</span>
                <div>
                  <strong>CNB Anti-Drug Hotline:</strong>
                  <div class="helpline-detail">1800-325-6666 (24/7 Toll-Free, Confidential)</div>
                </div>
              </div>
              <div class="helpline-item">
                <span class="helpline-icon">🏥</span>
                <div>
                  <strong>NAMS Clinic (IMH):</strong>
                  <div class="helpline-detail">6732-6837 (National Addictions Management Service)</div>
                </div>
              </div>
              <div class="helpline-item">
                <span class="helpline-icon">💬</span>
                <div>
                  <strong>Samaritans of Singapore (SOS):</strong>
                  <div class="helpline-detail">1767 (24/7 Hotline) / WhatsApp: 9151-1767</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="modal-footer">
          <button class="retro-btn dismiss-btn" @click="handleDismiss">
            ✕ RETURN TO GAME
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(2px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  box-sizing: border-box;
}

.modal-dialog {
  background: var(--retro-bg-dark);
  border: 3px solid var(--retro-warning);
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.95), inset 0 0 10px rgba(0, 0, 0, 0.7);
  max-width: 660px;
  width: 100%;
  max-height: 96%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  position: relative;
}

.modal-header {
  background: var(--retro-bg-darkest);
  border-bottom: 2px solid var(--retro-warning);
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 5;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.warning-pulse {
  color: var(--retro-warning);
  font-size: 14px;
  animation: crtFlicker 0.8s infinite;
}

.modal-title {
  font-size: 11px;
  color: var(--retro-warning);
  letter-spacing: 1.5px;
  font-weight: bold;
}

.modal-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sub-header {
  text-align: center;
  border-bottom: 1px dashed var(--retro-bg-darkest);
  padding-bottom: 8px;
}

.headline {
  font-size: 13px;
  font-weight: bold;
  color: var(--retro-text-light);
  letter-spacing: 1px;
}

.tagline {
  font-family: var(--font-terminal);
  font-size: 15px;
  color: var(--retro-text-muted);
  margin-top: 2px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

@media (max-width: 580px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: var(--retro-bg-darkest);
  border: 2px solid var(--retro-accent);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-badge {
  font-size: 8px;
  letter-spacing: 1px;
  font-weight: bold;
  align-self: flex-start;
  padding: 1px 5px;
  border-radius: 2px;
}

.danger-badge {
  background: rgba(230, 57, 70, 0.2);
  color: var(--retro-danger);
  border: 1px solid var(--retro-danger);
}

.warning-badge {
  background: rgba(255, 186, 8, 0.2);
  color: var(--retro-warning);
  border: 1px solid var(--retro-warning);
}

.alert-badge {
  background: rgba(0, 240, 255, 0.2);
  color: #38bdf8;
  border: 1px solid #38bdf8;
}

.accent-badge {
  background: rgba(82, 183, 136, 0.2);
  color: #52b788;
  border: 1px solid #52b788;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 1px;
  line-height: 1.1;
}

.text-danger {
  color: var(--retro-danger);
}

.text-warning {
  color: var(--retro-warning);
}

.text-alert {
  color: #38bdf8;
}

.text-accent {
  color: #52b788;
}

.stat-label {
  font-size: 9px;
  color: var(--retro-text-light);
  letter-spacing: 0.8px;
  font-weight: bold;
}

.stat-desc {
  font-family: var(--font-terminal);
  font-size: 14px;
  line-height: 1.35;
  color: var(--retro-text-light);
  margin: 0;
}

.stat-source {
  font-size: 7px;
  color: var(--retro-text-muted);
  opacity: 0.7;
  margin-top: 2px;
  font-style: italic;
}

.takeaway-box {
  background: rgba(0, 0, 0, 0.5);
  border-left: 3px solid var(--retro-warning);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.takeaway-title {
  font-size: 9px;
  color: var(--retro-warning);
  font-weight: bold;
  letter-spacing: 1px;
}

.takeaway-text {
  font-family: var(--font-terminal);
  font-size: 14px;
  line-height: 1.4;
  color: var(--retro-text-light);
  margin: 0;
}

.helpline-banner {
  background: var(--retro-bg-darkest);
  border: 1px solid var(--retro-accent);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.helpline-title {
  font-size: 9px;
  color: #52b788;
  letter-spacing: 1px;
  font-weight: bold;
}

.helpline-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.helpline-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 9px;
  color: var(--retro-text-light);
}

.helpline-icon {
  font-size: 11px;
}

.helpline-detail {
  font-family: var(--font-terminal);
  font-size: 13px;
  color: #b7e4c7;
}

.modal-footer {
  background: var(--retro-bg-darkest);
  border-top: 2px solid var(--retro-warning);
  padding: 8px 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  position: sticky;
  bottom: 0;
  z-index: 5;
}

.dismiss-btn {
  padding: 8px 16px;
  font-size: 10px;
}

.pop-fade-enter-active,
.pop-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.pop-fade-enter-from,
.pop-fade-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
