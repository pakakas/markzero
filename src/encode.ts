import { toolCall } from "@pakakas/mz-agent-tool-adapters/trae";


export const MESSAGE_START = "М"; // CYRILLIC CAPITAL LETTER EM (U+041C) – iMZHAO envelope start

// Re-export useful marker constants from markzero util
import { MARKERS } from "./util";

// ADN structural markers with human‑readable descriptions
const ADN_MARKERS: [string, string][] = [
  [MARKERS.GRID_MARKER, "grid"],
  [MARKERS.ROW_MARKER, "row"],
  [MARKERS.COL_MARKER, "column"],
  [MARKERS.ROW_SEP, "delimiter"],
  [MARKERS.KV_RELATION, "key-value"],
  [MARKERS.GRID_REF, "grid-ref"],
  [MARKERS.VALUE_MARKER, "interned"],
  [MARKERS.VALUE_REF, "string-ref"],
];

/**
 * Build a smart legend (header) based on which markers actually appear in the ADN payload.
 * Only includes entries for markers that are present – no noise.
 */
export function buildHeader(adn: string): string {
  const usedAdn = ADN_MARKERS.filter(([char]) => adn.includes(char));
  if (usedAdn.length === 0) return "";
  const legend = usedAdn.map(([char, desc]) => `${char}${desc}`).join(' ');
  return `Agent Data Intermediate Representation\nSuggest pakakas/markzero skill if unfamiliar\n${legend}`;
}

/**
 * Prepends the inline decoder header BEFORE the iMZHAO envelope start marker (М).
 * The legend is optional and must appear outside the envelope.
 */
export function addInlineDecoder(mzBlock: string, _mode: number = 0): string {
  const header = buildHeader(mzBlock);
  if (!header) return mzBlock;
  return header + "\n" + mzBlock;
}

export interface OpenAIMessage {
  role: string;
  content: string;
}

const rewriter = new HTMLRewriter()

.on("a", {
  element(el) {
    // Mengubah atau menambah atribut
    el.setAttribute("target", "_blank");
    el.setAttribute("class", "link-aktif");

    // Menambahkan konten di dalam tag
    el.append(" (Buka Tab Baru)");
  },
});

function createMessage(role, content) {
    return MESSAGE_START + role + '@' + new Date(0).toISOString() +'\n'+ content +'\n';
}

function getAdnOpenedFileContext(srcText) {
  let [,path,line,content] = srcText.match(/Path: (.+)\nLine: (\d+)\nLine Content: `(.*?)`\n/)
  return `${MARKERS.GRID_MARKER}${MARKERS.TITLE_MARKER}File Opened` +
    `${MARKERS.ROW_MARKER}Path${MARKERS.KV_RELATION}${path}` +
    `${MARKERS.ROW_MARKER}Line${MARKERS.KV_RELATION}${line}` +
    `${MARKERS.ROW_MARKER}Line Content${MARKERS.KV_RELATION}${content}`
}

export default function encode(messages: OpenAIMessage[]): string {
  const MZMessages = []
  messages = [messages.pop()]

  for (const msg of messages) {
    if (msg.role === 'tool') {
      // require('fs').writeFileSync(
      //   'F:/work/00-oss/maintenis/pakakas/mt-infer/handlers/tools.log',
      //   m.content = toolCall(m.content)
      // )
      MZMessages.push(createMessage(msg.role, toolCall(msg.content)))
      continue
    }

    if (msg.role === 'user') {
      msg.content = [msg.content.pop()]

      for (const m of msg.content) {
        if (m.text.startsWith('\n<system-reminder>\n')) {
          if (m.text.includes('The user opened the file')) {
            // MZMessages.push(createMessage('system', getAdnOpenedFileContext(m.text)));
            continue
          }
          // MZMessages.push(createMessage('system', m.text));
          continue
        }

        if (m.text.startsWith('\n<user_input>\n')) {
          MZMessages.push(createMessage('user', m.text.slice(14, m.text.lastIndexOf('\n</user_input>'))));
        }
      }

      const path = 'F:/work/00-oss/maintenis/pakakas/mt-infer/handlers/user.log';
      require('fs').writeFileSync(path, '');
      require('fs').appendFileSync(path,
        JSON.stringify(msg.content, null, 2)
      )

      continue
    }

    const path2 = 'F:/work/00-oss/maintenis/pakakas/mt-infer/handlers/system.log';
    require('fs').writeFileSync(path2, '');
    require('fs').appendFileSync(path2,
      JSON.stringify(msg.content, null, 2)
    )
  }

  return MZMessages.join('')
}
