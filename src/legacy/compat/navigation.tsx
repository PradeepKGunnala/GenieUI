import { useNavigate, useLocation } from 'react-router-dom';
export { useParams } from 'react-router-dom';
export function usePathname(){return useLocation().pathname;}
export function useRouter(){const navigate=useNavigate();return {push:(url:string)=>navigate(url),replace:(url:string)=>navigate(url,{replace:true})};}
