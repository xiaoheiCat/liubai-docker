<script setup lang="ts">
import cfg from "~/config";
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import { ccProps } from "./tools/types";
import { useCropperContent } from "./tools/useCropperContent";

const props = defineProps(ccProps)
const {
  tempStore,
  cropperRef,
} = useCropperContent(props)

</script>
<template>

  <div v-if="tempStore.imageUrlForCropper" class="cc-container">

    <Cropper
      :src="tempStore.imageUrlForCropper"
      :stencil-props="{ 
        aspectRatio: 1,
      }"
      :auto-zoom="true"
      image-restriction="stencil"
      class="cc-cropper"
      min-width="200"
      min-height="200"
      ref="cropperRef"
    >
    </Cropper>

  </div>

</template>
<style scoped lang="scss">

.cc-container {
  width: 100%;
  height: v-bind("'calc(100dvh - ' + cfg.navi_height + 'px)'");
  position: relative;
}

.cc-cropper {
  width: 100%;
  height: 100%;
  background-color: black;
}


</style>