import { useEffect, useRef } from "react";

interface YandexAdProps {
  blockId: string;
  className?: string;
}

declare global {
  interface Window {
    yaContextCb: Array<() => void>;
    Ya?: {
      Context?: {
        AdvManager?: {
          render: (params: { blockId: string; renderTo: string; }) => void;
        };
      };
    };
  }
}

let adCounter = 0;

export default function YandexAd({ blockId, className = "" }: YandexAdProps) {
  const idRef = useRef(`yandex-rtb-${blockId}-${++adCounter}`);
  const renderedRef = useRef(false);

  useEffect(() => {
    if (renderedRef.current) return;
    renderedRef.current = true;

    const render = () => {
      window.Ya?.Context?.AdvManager?.render({
        blockId,
        renderTo: idRef.current,
      });
    };

    window.yaContextCb = window.yaContextCb || [];
    window.yaContextCb.push(render);
  }, [blockId]);

  return (
    <div className={`overflow-hidden rounded-2xl ${className}`}>
      <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1 px-1">Реклама</p>
      <div id={idRef.current} />
    </div>
  );
}
