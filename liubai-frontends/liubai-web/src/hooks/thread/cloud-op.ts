import type { ThreadShow } from "~/types/types-content"
import { LocalToCloud } from "~/utils/cloud/LocalToCloud"
import liuUtil from "~/utils/liu-util"

function saveContentToCloud(
  thread: ThreadShow,
  stamp: number,
  isUndo = false,
) {
  const ss = thread.storageState
  const isLocal = liuUtil.check.isLocalContent(ss)
  if(isLocal) return

  LocalToCloud.addTask({
    uploadTask: isUndo ? "undo_thread-state" : "thread-state",
    target_id: thread._id,
    operateStamp: stamp,
  })
}

export default {
  saveContentToCloud,
}