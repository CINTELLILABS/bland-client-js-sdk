import Bland from "./client/client";
import Webchat from "./client/webchat/webchat";

export type { BlandClientOptions } from "./types/client";
export type {
  IWebchatConfiguration,
  IWebchatState,
  IWebchatWSSettings,
} from "./types/webchat";

export { Webchat, Bland };
export default Bland;
