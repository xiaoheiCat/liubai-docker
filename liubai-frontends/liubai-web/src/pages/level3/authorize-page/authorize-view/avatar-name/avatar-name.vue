<script setup lang="ts">
import type { MemberShow } from '~/types/types-content';
import type { PropType } from 'vue';
import LiuAvatar from '~/components/common/liu-avatar/liu-avatar.vue';

defineProps({
  profile: {
    type: Object as PropType<MemberShow>,
    required: true
  }
})

</script>
<template>

  <div class="sc-avatar-name">
    <LiuAvatar v-if="profile" :member-show="profile" class="sc-avatar" 
      font-size="14px"
    ></LiuAvatar>

    <div class="liu-no-user-select sc-title" v-if="profile?.name">
      <span>{{ profile.name }}</span>
    </div>
  </div>

</template>
<style scoped lang="scss">
.sc-avatar-name {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sc-avatar {
  flex: none;
  width: 20px;
  height: 20px;
  margin-inline-end: 10px;
}

.sc-title {
  font-size: var(--mini-font);
  color: var(--main-code);
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 1px;
}

@media screen and (min-width: 491px) {
  .sc-avatar {
    width: 24px;
    height: 24px;
    margin-inline-end: 12px;
  }

  .sc-title {
    font-size: var(--btn-font);
  }
}
</style>