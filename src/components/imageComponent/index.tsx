import { ImgHTMLAttributes } from "react";

interface IProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  width?: number;
  height?: number;
  className?: string;
  figClassName?: string;
  alt?: string;
  blurEffect?: boolean;
  priority?: boolean;
  fill?: boolean;
}

const ImageComponent = ({
  src,
  width,
  height,
  className,
  figClassName,
  alt,
  fill, // ignored in React version
  blurEffect, // ignored in React version
  priority, // ignored in React version
  ...rest
}: IProps) => {
  return (
    <figure className={`leading-0 relative ${figClassName || ""}`}>
      <img
        src={src}
        width={width}
        height={height}
        className={className}
        alt={alt || "Image"}
        {...rest}
      />
    </figure>
  );
};

export default ImageComponent;
