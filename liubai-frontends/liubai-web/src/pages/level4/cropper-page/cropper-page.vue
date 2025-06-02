<script setup lang="ts">
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import CropperContent from "./cropper-content/cropper-content.vue";

</script>
<template>
  <div class="liu-simple-page">
    <scroll-view>
      <navi-virtual></navi-virtual>

      <div class="liu-mc-container">
        <div class="liu-mc-box">
          <CropperContent></CropperContent>
        </div>
      </div>

    </scroll-view>
    <navi-bar 
      title-key="common.crop"
    ></navi-bar>
  </div>
</template>
<style scoped lang="scss">


</style>