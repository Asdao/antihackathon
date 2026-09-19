<script setup lang="ts">
import { useGameState } from '../state/useGameState';

const { state, closeStatsModal, resetGame } = useGameState();

function handleDismiss() {
  closeStatsModal();
}

function handleRestart() {
  closeStatsModal();
  resetGame();
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
          <button class="close-btn" title="Close" @click="handleDismiss">✕</button>
        </div>

        <!-- Scrollable Body -->
        <div class="modal-content">
          <div class="sub-header">
            <div class="headline">THE MAGNITUDE BEHIND THE SIMULATION</div>
            <div class="tagline">Substance abuse is not an isolated choice—it is an exponential public health crisis.</div>
          </div>

          <!-- 4 Core Statistics Grid -->
          <div class="stats-grid">
            <!-- Stat 1: Global Fatalities -->
            <div class="stat-card">
              <div class="stat-badge danger-badge">ANNUAL MORTALITY</div>
              <div class="stat-value text-danger">500,000+</div>
              <div class="stat-label">LIVES LOST PER YEAR</div>
              <p class="stat-desc">
                Preventable fatalities worldwide directly attributed to illicit drug use, overdoses, and substance-induced health failures.
              </p>
              <div class="stat-source">Source: UNODC World Drug Report</div>
            </div>

            <!-- Stat 2: Youth Onset -->
            <div class="stat-card">
              <div class="stat-badge warning-badge">CRITICAL WINDOW</div>
              <div class="stat-value text-warning">70%+</div>
              <div class="stat-label">BEGIN BEFORE AGE 20</div>
              <p class="stat-desc">
                Of individuals with chronic substance disorders started during adolescence, when the developing brain is most susceptible to dependency.
              </p>
              <div class="stat-source">Source: NIDA / SAMHSA</div>
            </div>

            <!-- Stat 3: Young Adult Prevalence -->
            <div class="stat-card">
              <div class="stat-badge alert-badge">YOUNG ADULT TOLL</div>
              <div class="stat-value text-alert">1 IN 8</div>
              <div class="stat-label">AFFECTED YOUTHS</div>
              <p class="stat-desc">
                Young adults aged 18–25 currently meet the clinical criteria for active substance use disorder, often starting from casual peer exposure.
              </p>
              <div class="stat-source">Source: NSDUH Survey Data</div>
            </div>

            <!-- Stat 4: Societal & Financial Cost -->
            <div class="stat-card">
              <div class="stat-badge accent-badge">SOCIETAL IMPACT</div>
              <div class="stat-value text-accent">$740B+</div>
              <div class="stat-label">ANNUAL ECONOMIC LOSS</div>
              <p class="stat-desc">
                Annual damages in emergency healthcare, criminal justice proceedings, lost employment potential, and broken families in the US alone.
              </p>
              <div class="stat-source">Source: NIH / CDC Economic Estimates</div>
            </div>
          </div>

          <!-- Takeaway Note -->
          <div class="takeaway-box">
            <div class="takeaway-title">CRISIS PERSPECTIVE:</div>
            <p class="takeaway-text">
              In this simulation, each step felt like a temporary coping mechanism—from school allowance to debt, extortion, and physical collapse. 
              In real life, addiction hijacks brain chemistry and destroys safety nets. Recognition, honest conversation, and early intervention save lives.
            </p>
          </div>

          <!-- Helpline Banner -->
          <div class="helpline-banner">
            <div class="helpline-title">FREE, CONFIDENTIAL 24/7 SUPPORT:</div>
            <div class="helpline-grid">
              <div class="helpline-item">
                <span class="helpline-icon">📞</span>
                <div>
                  <strong>SAMHSA National Helpline:</strong>
                  <div class="helpline-detail">1-800-662-4357 (Toll-Free, 24/7, English & Spanish)</div>
                </div>
              </div>
              <div class="helpline-item">
                <span class="helpline-icon">💬</span>
                <div>
                  <strong>Crisis Text Line:</strong>
                  <div class="helpline-detail">Text "HOME" to 741741</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="modal-footer">
          <button class="retro-btn dismiss-btn" @click="handleDismiss">
            ✕ DISMISS DOSSIER
          </button>
          <button class="retro-btn restart-action-btn" @click="handleRestart">
            ↻ RESTART LIFE SIMULATION
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

.close-btn {
  background: transparent;
  border: 1px solid var(--retro-warning);
  color: var(--retro-warning);
  font-family: inherit;
  font-size: 11px;
  padding: 2px 7px;
  cursor: pointer;
  transition: all 0.1s ease;
}

.close-btn:hover {
  background: var(--retro-warning);
  color: #000;
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
  padding: 6px 12px;
  font-size: 10px;
}

.restart-action-btn {
  background: var(--retro-danger);
  color: #fff;
  padding: 6px 12px;
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
