<script setup lang="ts">
import { initBrowseCode } from './tools/useBrowseCode'
import { useI18n } from 'vue-i18n'
import CodeHighlight from './code-highlight/code-highlight.vue'

const {
  bcData,
  TRANSITION_DURATION,
  onTapClose,
  onTapCopy,
} = initBrowseCode()

const { t } = useI18n()

</script>
<template>

  <div v-if="bcData.enable" class="bc-container"
    :class="{ 'bc-container_show': bcData.show }"
  >
    <div class="bc-bg" @click.stop="onTapClose"></div>
    
    <!-- code display area -->
    <div class="bc-code-area" :class="{ 'bc-code-area_show': bcData.show }">
      
      <div class="bc-code-header">
        <div class="bc-lang-tag" v-if="bcData.language">
          <span class="liu-no-user-select">{{ bcData.language }}</span>
        </div>
        <div class="bc-copy-btn" @click.stop="onTapCopy">
          <svg-icon name="copy" color="#bbb"
            class="bc-copy-svg"
          ></svg-icon>
          <span>{{ t('editor.copy') }}</span>

          <div class="cbrt-copied" :class="{ 'cbrt-copied_show': bcData.copiedTimeout }">
            <svg-icon name="check" color="var(--code-btn-text)" class="bc-copy-svg"></svg-icon>
            <span>{{ t('common.copied') }}</span>
          </div>
        </div>
      </div>
      
      <div class="bc-code-content">
        <CodeHighlight 
          :code="bcData.code" 
          :language="bcData.language" 
        />
      </div>
    </div>
    
    <!-- close overlay moved to bottom of container -->
    <div class="bc-close-overlay" @click.stop="onTapClose">
      <div class="bc-close-text">
        <span>{{ t('common.click_to_close') }}</span>
      </div>
    </div>
  </div>

</template>
<style scoped lang="scss">

.bc-container {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 5vh;
  z-index: 2600;
  opacity: 0;
  transition-duration: v-bind("TRANSITION_DURATION + 'ms'");

  &.bc-container_show {
    opacity: 1;
  }

  .bc-bg {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background: var(--frosted-glass-3);
    -webkit-backdrop-filter: blur(5px);
    backdrop-filter: blur(5px);
  }
}

.bc-code-area {
  position: relative;
  width: 95%;
  max-width: 900px;
  height: 92vh;
  max-height: 92dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background-color: #1e1e1e;
  transition-timing-function: cubic-bezier(0.17, 0.86, 0.45, 1);
  transition-duration: v-bind("TRANSITION_DURATION + 'ms'");
  transform: translateY(25%);
  opacity: 0;
  margin-block-start: -20px;

  &.bc-code-area_show {
    transform: translateY(0);
    opacity: 1;
  }
}

.bc-code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
}

.bc-lang-tag {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: var(--mini-font);
  color: #ddd;
  font-weight: 500;
  letter-spacing: 1px;
}

.bc-copy-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 6px;
  background-color: #404040;
  color: #bbb;
  font-size: var(--mini-font);
  cursor: pointer;
  transition: .15s;
  position: relative;
  box-sizing: border-box;

  .bc-copy-svg {
    width: 16px;
    height: 16px;
    margin-inline-end: 4px;
  }
}

.cbrt-copied {
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #404040;
  opacity: 0;
  visibility: hidden;
  transition: .15s;
  will-change: opacity;
  border-radius: 6px;
  overflow: hidden;
}

.cbrt-copied_show {
  visibility: visible;
  opacity: 1;
}

.bc-code-content {
  flex: 1;
  overflow: hidden;
  padding: 0;
  border-radius: 0 0 12px 12px;
}

.bc-close-overlay {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
  pointer-events: none;
  z-index: 1;
}

.bc-close-text {
  background-color: rgba(0, 0, 0, 0.7);
  color: rgba(255, 255, 255, 0.8);
  padding: 12px 24px;
  border-radius: 20px;
  font-size: var(--mini-font);
  font-weight: 500;
  backdrop-filter: blur(4px);
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  user-select: none;
  -webkit-user-select: none;
}

@media(hover: hover) {
  .bc-close-text:hover {
    background-color: rgba(0, 0, 0, 0.9);
    color: rgba(255, 255, 255, 1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .bc-copy-btn:hover {
    background-color: #555;
  }
}

@media screen and (max-width: 500px) {
  .bc-close-text {
    padding: 10px 20px;
  }
}

</style>
