import { Rect, Path, Group, Textbox } from 'fabric';
import { useStore } from '../store/useStore';

export const createRoundedRect = (left: number, top: number, width: number, height: number) => {
  const color = useStore.getState().recentColors[0] || '#3b82f6';
  return new Rect({ left, top, width, height, rx: 10, ry: 10, fill: color + '33', stroke: color, strokeWidth: 2 });
};

export const createCallout = (left: number, top: number, width: number, height: number, direction: 'right' | 'left' | 'top' | 'bottom') => {
  const color = useStore.getState().recentColors[0] || '#3b82f6';
  
  const r = new Rect({ left: 0, top: 0, width, height, rx: 10, ry: 10, fill: color + '33', stroke: color, strokeWidth: 2 });
  
  let tailPath = '';
  if (direction === 'right') tailPath = `M ${width} ${height/2 - 10} L ${width + 20} ${height/2} L ${width} ${height/2 + 10} Z`;
  else if (direction === 'left') tailPath = `M 0 ${height/2 - 10} L -20 ${height/2} L 0 ${height/2 + 10} Z`;
  else if (direction === 'top') tailPath = `M ${width/2 - 10} 0 L ${width/2} -20 L ${width/2 + 10} 0 Z`;
  else if (direction === 'bottom') tailPath = `M ${width/2 - 10} ${height} L ${width/2} ${height + 20} L ${width/2 + 10} ${height} Z`;

  const tail = new Path(tailPath, { fill: color + '33', stroke: color, strokeWidth: 2 });
  
  const text = new Textbox('Text', { left: 10, top: 10, width: width - 20, fontSize: 14, fontFamily: 'Inter', fill: '#000000', textAlign: 'center', originX: 'left', originY: 'top', splitByGrapheme: true });

  return new Group([r, tail, text], { left, top });
};

export const createSpiral = (left: number, top: number, turns: number, spacing: number) => {
  const color = useStore.getState().recentColors[0] || '#3b82f6';
  let pathStr = 'M 0 0';
  for (let i = 0; i <= turns * 360; i += 10) {
    const angle = i * Math.PI / 180;
    const r = spacing * i / 360;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    pathStr += ` L ${x} ${y}`;
  }
  return new Path(pathStr, { left, top, fill: 'transparent', stroke: color, strokeWidth: 2 });
};
