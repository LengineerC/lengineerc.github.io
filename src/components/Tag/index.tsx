"use client";

import './index.scss';
import { NavLink } from '@/components/RouterCompat';

type Props = {
  tag: string;
  reload?: boolean;
};

export default function Tag({ tag, reload = false }: Props) {
  const bgColor = Array.from(tag).reduce((sum, character) => sum + character.codePointAt(0)!, 0) % 3;

  const colorChooser = (color: number): string => {
    let style = 'tag-bg-color-';
    return style + color;
  };

  const reloadPage = () => {
    if (reload) {
      window.location.reload();
    }
  };

  return (
    <div className="tag-main">
      <NavLink className="tag-link" onClick={reloadPage} to={`/tags/${encodeURIComponent(tag)}`}>
        <div className={colorChooser(bgColor)}>{tag}</div>
      </NavLink>
    </div>
  );
}
