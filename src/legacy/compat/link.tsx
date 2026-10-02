import { Link as RouterLink } from 'react-router-dom';
import type { AnchorHTMLAttributes } from 'react';
export default function Link({href,...props}: AnchorHTMLAttributes<HTMLAnchorElement> & {href:string}) {return <RouterLink to={href} {...props}/>;}
