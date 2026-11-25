import Photo, { type PhotoData } from "./Photo";

export default function Marquee({ items }: { items: { name: string; photo: PhotoData }[] }) {
  const list = [...items, ...items];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="track">
        {list.map((it, i) => (
          <span className="m-item" key={`${it.name}-${i}`}>
            <span className="m-thumb">
              <Photo photo={it.photo} sizes="64px" />
            </span>
            <span className="m-name">{it.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
