import _wx from "weixin-js-sdk"

type OriginalWx = typeof _wx
export interface LiuWx extends OriginalWx {
	miniProgram: OriginalWx["miniProgram"] & {
		navigateBack: () => void
	}
}