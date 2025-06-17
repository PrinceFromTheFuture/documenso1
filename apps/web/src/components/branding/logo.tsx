import type { SVGAttributes } from 'react';
import '../../styles/custom.css';


export type LogoProps = React.ImgHTMLAttributes<HTMLImageElement>;

export const Logo = (props: LogoProps) => {
  const imageUrl = getAssetUrl('static/logo.png');

  return <img src={imageUrl} {...props} alt="Logo" className="topLogo" />;
};


function getAssetUrl(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_WEBAPP_URL + '/';
  return `${basePath}${path}`;
}