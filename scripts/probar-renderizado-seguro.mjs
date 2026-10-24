import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

// Ejecuta las funciones de producción con datos sintéticos, sin red ni sesiones.
// El fixture registra nodos y fronteras texto/HTML. Su lector mínimo de marcas
// permite contrastar el código anterior, pero no sustituye un navegador real.
const account=await readFile(new URL('../auth.js',import.meta.url),'utf8');
const product=await readFile(new URL('../producto.js',import.meta.url),'utf8');
const main=await readFile(new URL('../script.js',import.meta.url),'utf8');
function between(source,start,end){
  const first=source.indexOf(start),last=source.indexOf(end,first);
  assert.ok(first>=0&&last>first,`No se encontró el fragmento real: ${start}`);
  return source.slice(first,last);
}
const escapeSource=between(account,'const escapeAccountHtml=','const redirectUrl=');
const favoriteSource=between(account,'async function setupFavoriteCards()','// Registro con consentimiento');
const categorySource=between(product,'const loadProductHeaderCategories=async()=>{','void loadProductHeaderCategories();');
const eventStart=product.indexOf("document.addEventListener('click',event=>{");
const eventEnd=product.indexOf('},true);',eventStart);
assert.ok(eventStart>=0&&eventEnd>eventStart,'No se encontró el acordeón real de categorías');
const categoryEvent=product.slice(eventStart,eventEnd+'},true);'.length);
const textMarkup=value=>String(value).replace(/[&<>]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[char]));
const textValue=value=>String(value).replace(/&(amp|lt|gt|quot|#39);/g,(_all,name)=>({'amp':'&','lt':'<','gt':'>','quot':'"','#39':"'"}[name]));
const dataName=name=>'data-'+name.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());

class Element {
  constructor(tagName){
    this.tagName=tagName.toUpperCase();this.children=[];this.parentElement=null;
    this.dataset={};this.attributes=new Map();this._text='';this._markup=null;this.className='';
    this.classList={contains:name=>this.className.split(/\s+/).includes(name),toggle:(name,force)=>{
      const names=new Set(this.className.split(/\s+/).filter(Boolean)),add=force??!names.has(name);
      if(add)names.add(name);else names.delete(name);this.className=[...names].join(' ');return add;
    }};
  }
  set textContent(value){this._text=String(value??'');this._markup=null;this.children=[];}
  get textContent(){return this._text+this.children.map(child=>child.textContent).join('');}
  set innerHTML(value){
    this._markup=null;this._text='';this.children=[];
    const stack=[this];
    for(const token of String(value).match(/<!--[\s\S]*?-->|<\/?[^>]+>|[^<]+/g)??[]){
      if(token.startsWith('<!--'))continue;
      if(token.startsWith('</')){if(stack.length>1)stack.pop();continue;}
      if(token.startsWith('<')){
        const opening=token.match(/^<([a-z][\w-]*)([\s\S]*?)\/?\s*>$/i);assert.ok(opening,'Marca no compatible con el fixture');
        const node=new Element(opening[1]);
        for(const attribute of opening[2].matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))node.setAttribute(attribute[1],textValue(attribute[2]??attribute[3]??attribute[4]??''));
        stack.at(-1).append(node);
        if(!/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i.test(opening[1])&&!token.endsWith('/>'))stack.push(node);
      }else{const text=new Element('#text');text.textContent=textValue(token);stack.at(-1).append(text);}
    }
  }
  get innerHTML(){return this._markup??textMarkup(this._text)+this.children.map(child=>child.outerHTML).join('');}
  get outerHTML(){return this.tagName==='#TEXT'?textMarkup(this.textContent):`<${this.tagName.toLowerCase()}>${this.innerHTML}</${this.tagName.toLowerCase()}>`;}
  append(...nodes){this._markup=null;for(const node of nodes){node.parentElement=this;this.children.push(node);}}
  replaceChildren(...nodes){this._text='';this._markup=null;this.children=[];this.append(...nodes);}
  setAttribute(name,value){this.attributes.set(name,String(value));if(name==='class')this.className=String(value);if(name==='id')this.id=String(value);}
  getAttribute(name){return this.attributes.get(name)??null;}
  matches(selector){
    if(selector.startsWith('.'))return this.classList.contains(selector.slice(1));
    if(selector.startsWith('#'))return this.id===selector.slice(1);
    if(selector.startsWith('[')){
      const name=selector.slice(1,-1);
      return this.attributes.has(name)||Object.keys(this.dataset).some(key=>dataName(key)===name);
    }
    return this.tagName.toLowerCase()===selector;
  }
  querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
  querySelector(selector){return this.querySelectorAll(selector)[0]??null;}
  closest(selector){
    const parts=selector.split(/\s+/),last=parts.pop();
    for(let node=this;node;node=node.parentElement){
      if(!node.matches(last))continue;
      if(!parts.length)return node;
      let parent=node.parentElement;
      while(parent&&!parent.matches(parts.join(' ')))parent=parent.parentElement;
      if(parent)return node;
    }
    return null;
  }
}
function query(data){
  const result={data,error:null},chain={then:(yes,no)=>Promise.resolve(result).then(yes,no)};
  for(const name of ['select','eq','in','order'])chain[name]=()=>chain;
  return chain;
}
async function favorites(image,name='Cuaderno'){
  // La tarjeta se comprueba como salida HTML; sus acciones no forman parte de H06.
  const host={innerHTML:'',querySelectorAll:()=>[]},storageCalls=[];
  const rows={favoritos_ecommerce:[{producto_id:'p1'}],catalogo_productos:[{id:'p1',nombre:name,slug:'cuaderno',precio_base:12,categoria_id:'c1'}],producto_imagenes:image?[{producto_id:'p1',...image}]:[],categorias:[{id:'c1',nombre:'Papelería'}]};
  const authClient={auth:{getUser:async()=>({data:{user:{id:'cliente-sintetico'}}})},from:table=>query(rows[table]),storage:{from:bucket=>{
    assert.equal(typeof bucket,'string','La resolución de Storage requiere un bucket real');
    return{getPublicUrl:path=>{assert.equal(typeof path,'string');storageCalls.push({bucket,path});return{data:{publicUrl:`https://storage.example/${bucket}/${path}`}};}};
  }}};
  const context=vm.createContext({authClient,byId:id=>id==='favoritesList'?host:null,document:{createElement:tag=>new Element(tag)},window:{location:{}}});
  vm.runInContext(`${escapeSource}\n${favoriteSource}\nglobalThis.runFavorites=setupFavoriteCards;`,context,{filename:'auth.js favoritos reales'});
  await context.runFavorites();return{html:host.innerHTML,storageCalls};
}
for(const [name,image,url,calls] of [
  ['URL pública sin datos de Storage',{url_publica:'https://images.example/directa.jpg'},'https://images.example/directa.jpg',[]],
  ['URL pública preferida sobre otra ruta de Storage',{url_publica:'https://images.example/directa.jpg',storage_bucket:'productos',storage_path:'otra.jpg'},'https://images.example/directa.jpg',[]],
  ['Storage con bucket y ruta',{storage_bucket:'productos',storage_path:'foto.jpg'},'https://storage.example/productos/foto.jpg',[{bucket:'productos',path:'foto.jpg'}]],
  ['URL pública vacía permite Storage',{url_publica:'',storage_bucket:'productos',storage_path:'foto.jpg'},'https://storage.example/productos/foto.jpg',[{bucket:'productos',path:'foto.jpg'}]],
  ['sin registro de imagen',null,null,[]],
  ['registro sin fuentes',{},null,[]],
  ['bucket sin ruta',{storage_bucket:'productos'},null,[]],
  ['ruta sin bucket',{storage_path:'foto.jpg'},null,[]]
])test(`favoritos: ${name}`,async()=>{
  const result=await favorites(image);assert.deepEqual(result.storageCalls,calls);
  if(url){assert.ok(result.html.includes(`<img src="${url}"`));assert.ok(!result.html.includes('favorite-image-empty'));}
  else{assert.ok(!result.html.includes('<img '));assert.ok(result.html.includes('favorite-image-empty'));}
  assert.ok(result.html.includes('Cuaderno'),'La tarjeta sigue mostrando el producto');
});
test('favoritos conserva comillas de nombres y URL dentro de sus atributos',async()=>{
  const name='Cuaderno " onpointerover="alert(1) & <b>Arte</b>',url='https://images.example/foto.jpg" onerror="alert(1)',result=await favorites({url_publica:url},name);
  const rendered=new Element('div');rendered.innerHTML=result.html;
  const image=rendered.querySelector('img'),remove=rendered.querySelector('[data-remove-favorite]');
  assert.equal(image.getAttribute('src'),url);assert.equal(image.getAttribute('alt'),name);
  assert.equal(image.getAttribute('onerror'),null);assert.equal(image.getAttribute('onpointerover'),null);
  assert.equal(remove.getAttribute('aria-label'),`Quitar ${name} de favoritos`);assert.equal(remove.getAttribute('onpointerover'),null);
  assert.equal(rendered.querySelector('.product-name').textContent,name);assert.equal(rendered.querySelectorAll('b').length,0);
  assert.deepEqual(result.storageCalls,[]);
});
for(const [name,source,declaration] of [
  ['escapeAccountHtml',escapeSource,'escapeAccountHtml'],
  ['esc de producto',between(product,'const esc=','const money='),'esc'],
  ['escapeHtml del catálogo',between(main,'function escapeHtml(','function safeImageUrl('),'escapeHtml']
])test(`${name} protege texto y ambas comillas en atributos HTML`,()=>{
  const context=vm.createContext({document:{createElement:tag=>new Element(tag)}});
  vm.runInContext(`${source}\nglobalThis.escapeValue=${declaration};`,context);
  assert.equal(context.escapeValue('<img title="Arte" data-x=\'papelería\'> & texto'),'&lt;img title=&quot;Arte&quot; data-x=&#39;papelería&#39;&gt; &amp; texto');
});

async function categories(name,{child=true}={}){
  const nav=new Element('nav');nav.id='categoryNav';const events=new Map();
  const rows=[{id:'padre',nombre:name,slug:'papeleria',categoria_padre_id:null},...(child?[{id:'hijo',nombre:'Cuadernos',slug:'cuadernos',categoria_padre_id:'padre'}]:[])];
  const context=vm.createContext({window:{supabaseClient:{from:table=>{assert.equal(table,'categorias');return query(rows);}}},document:{querySelector:selector=>selector==='#categoryNav'?nav:null,createElement:tag=>new Element(tag),addEventListener:(event,handler,capture)=>{events.set(event,{handler,capture});}},console});
  vm.runInContext(`${categorySource}\n${categoryEvent}\nglobalThis.loadCategories=loadProductHeaderCategories;`,context,{filename:'producto.js categorías y acordeón reales'});
  await context.loadCategories();
  return{nav,events,click(target){let prevented=0,stopped=0;events.get('click').handler({target,preventDefault(){prevented++;},stopPropagation(){stopped++;}});return{prevented,stopped};}};
}
for(const name of ['Arte & escritura','<img src=x onerror="globalThis.h06Injected=true"> & <b>Papelería</b>'])test(`categoría padre conserva su nombre como texto literal: ${name}`,async()=>{
  const {nav}=await categories(name),toggle=nav.querySelector('.nav-parent');
  assert.ok(toggle);assert.equal(toggle.textContent,name+'⌄');
  assert.equal(toggle.children.length,2);assert.equal(toggle.children[0].tagName,'SPAN');
  assert.equal(toggle.children[0].textContent,name);assert.equal(toggle.children[0].innerHTML,textMarkup(name));
  assert.equal(toggle.getAttribute('aria-label'),`Mostrar subcategorías de ${name}`);
  assert.equal(toggle.querySelectorAll('img').length,0);assert.equal(toggle.querySelectorAll('b').length,0);
  const parentLink=nav.querySelector('.nav-parent-link');assert.equal(parentLink.textContent,name);
  assert.equal(parentLink.href,'catalogo.html?categoria=papeleria');
});
test('el acordeón conserva icono, accesibilidad y apertura/cierre al pulsar el icono',async()=>{
  const f=await categories('Papelería'),toggle=f.nav.querySelector('.nav-parent'),icon=toggle.querySelector('[data-subnav-icon]'),dropdown=toggle.closest('.nav-dropdown');
  assert.ok(icon);assert.equal(icon.className,'subnav-toggle');assert.equal(icon.getAttribute('aria-hidden'),'true');
  assert.equal(icon.textContent,'⌄');assert.equal(toggle.getAttribute('aria-expanded'),'false');
  assert.equal(f.events.get('click').capture,true);
  assert.deepEqual(f.click(icon),{prevented:1,stopped:1});
  assert.equal(dropdown.classList.contains('open'),true);assert.equal(toggle.getAttribute('aria-expanded'),'true');
  assert.equal(toggle.getAttribute('aria-label'),'Ocultar subcategorías de Papelería');assert.equal(icon.textContent,'⌃');
  f.click(icon);assert.equal(dropdown.classList.contains('open'),false);assert.equal(toggle.getAttribute('aria-expanded'),'false');
  assert.equal(toggle.getAttribute('aria-label'),'Mostrar subcategorías de Papelería');assert.equal(icon.textContent,'⌄');
});
test('una categoría sin hijos permanece como enlace de texto',async()=>{
  const name='<b>Sin hijos</b>',{nav}=await categories(name,{child:false});
  assert.equal(nav.querySelector('.nav-parent'),null);assert.equal(nav.children[1].textContent,name);
  assert.equal(nav.children[1].dataset.category,name);assert.equal(nav.children[1].href,'catalogo.html?categoria=papeleria');
});
