<script setup lang="ts">
import { type PropType, computed } from 'vue';
import type { LiuIDEType } from '~/types/types-atom';
import { useSystemStore } from '~/hooks/stores/useSystemStore';
import { storeToRefs } from 'pinia';
import { showIdeName } from '~/utils/show/custom-show';

const props = defineProps({
  ideType: {
    type: String as PropType<LiuIDEType>,
    required: true,
  },
  iconName: {
    type: String,
    required: true,
  }
})

const fontColor = computed(() => {
  const ideType = props.ideType
  if(ideType === "cnb.cool") return "var(--liu-cnb-cool-font)"
  if(ideType === "github.dev") return "var(--liu-github-font)"
  if(ideType === "vscode.dev") return "var(--liu-vscode-font)"
  if(ideType === "gitpod.io") return "var(--liu-gitpod-font)"
  if(ideType === "stackblitz.com") return "var(--liu-stackblitz-font)"
  return `var(--liu-${ideType}-font)`
})

const systemStore = useSystemStore()
const { supported_theme: theme } = storeToRefs(systemStore)

const ideName = computed(() => {
  const ideType = props.ideType
  return showIdeName(ideType)
})

</script>
<template>

  <div class="state-badge-container">

    <div class="liu-no-user-select tct-state-box" :style="{
      'color': fontColor,
    }">

      <!-- icon for windsurf -->
      <svg-icon v-if="ideType === 'windsurf'"
        class="ib-icon ib-icon_windsurf"
        name="logos-windsurf"
        :color="fontColor"
      ></svg-icon>

      <!-- icon for github.dev -->
      <svg-icon v-else-if="ideType === 'github.dev'"
        class="ib-icon"
        name="logos-github"
        color="var(--main-normal)"
      ></svg-icon>
      
      <!-- general icon -->
      <svg-icon v-else class="ib-icon"
        :name="iconName"
        :coverFillStroke="false"
        :class="{
          'ib-icon_trae': ideType === 'trae'
        }"
      ></svg-icon>

      <!-- text -->
      <span class="tctsb-text">{{ ideName }}</span>
    </div>

  </div>

</template>
<style scoped lang="scss">

.state-badge-container {
  position: relative;
  width: fit-content;
}

.tct-state-box {
  padding: 2px 8px;
  border-radius: 2px 10px 2px 10px;
  min-width: 50px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: .15s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.tct-state-box::before {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  content: "";
  background: var(--liu-ide-bg);
  z-index: 0;
  opacity: .98;
}

.ib-icon, .tctsb-text {
  position: relative;
  z-index: 1;
}

.ib-icon {
  width: 14px;
  height: 14px;
  margin-inline-end: 6px;
}

.ib-icon_trae {
  width: 12px;
  height: 12px;
}

.ib-icon_windsurf {
  width: 16px;
  height: 16px;
  margin-inline-end: 5px;
}

.tct-ai-circle {
  border-radius: 50%;
}

.tctsb-text {
  font-size: var(--state-font);
}


@media(hover: hover) {
  .tct-state-box:hover {
    opacity: .8;
  }
}


</style>