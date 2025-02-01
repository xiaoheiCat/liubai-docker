<script lang="ts" setup>
import { computed, type PropType } from 'vue';
import type { MemberShow } from "~/types/types-content"

const props = defineProps({
  memberShow: {
    type: Object as PropType<MemberShow>,
  },
  borderRadius: {
    type: String,
    default: "50%",
  },
  fontSize: {
    type: String,
  }
})

// 头像里的文字
const char = computed(() => {
  const name = props.memberShow?.name
  if(!name) return ""
  const f = name[0]
  if(!f) return ""
  const F = f.toUpperCase()
  if(F >= "A" && F <= "Z") return F
  const lastOne = name[name.length - 1]
  if(lastOne) return lastOne
  return ""
})

const charSize = computed(() => {
  if(props.fontSize) return props.fontSize

  const c = char.value
  if(c >= "A" && c <= "Z") return "25px"
  return "22px"
})

const hasAvatar = computed(() => {
  const ava = props.memberShow?.avatar
  if(ava?.src) return true
  return false
})

</script>
<template>

  <div class="liu-no-user-select la-container">

    <div class="la-bg" v-if="!hasAvatar"></div>

    <liu-img v-if="hasAvatar" 
      :src="(memberShow?.avatar?.src as string)"
      :border-radius="borderRadius"
      class="la-img"
    ></liu-img>

    <span class="la-span" v-else>{{ char }}</span>

  </div>


</template>
<style lang="scss" scoped>

.la-container {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: v-bind("borderRadius");
  overflow: hidden;
  position: relative;

  .la-bg {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background-color: var(--avatar-bg);
    opacity: 1;
  }

  .la-img {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .la-span {
    font-size: v-bind("charSize");
    color: var(--avatar-color);
    position: relative;
    font-weight: 500;
  }
}



</style>