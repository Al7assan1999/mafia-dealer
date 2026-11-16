const T: Record<string, Record<string, string>> = { en: EN, ar: AR };
const t=(k: string,v?: Record<string,any>): string=>{let s=(T[S.lang]&&T[S.lang][k])||T.en[k]||k;if(v)for(const x in v)s=s.split('{'+x+'}').join(v[x]);return s;};
