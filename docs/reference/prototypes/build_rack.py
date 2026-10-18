import argparse
from pathlib import Path
import random
B={'top':'/_blob/63679c6623c7a971b10b6520872379a2','mid':'/_blob/87560ff46757c5ca4e30400f14bf3346','srv2u':'/_blob/fb86bab6d3ee00a04d9b75a8b0e4eb7e','ups':'/_blob/c16483ef998ee145ceea3441b948e5f6','switch':'/_blob/23e01cc512dea2e9a4cd72dce85c58ef','patch':'/_blob/229974cb53b507e2a9c84fb4184f23e4','blank':'/_blob/8b8c947e9d8b1316b08fc712f316bf8d','tray':'/_blob/2544913e2a8c3ac00efb423245e2393e','s1u':'/_blob/ed85335998a50c3047b61b3c8253df83'}
EW=500; CABW=620; EAR=60; TOPH=208
HT={'patch':52,'switch':62,'sep':50,'s1u':55,'srv2u':81,'ups':85}
projects=[('PROJECT A','a.revenantal.com','Site','A one-line description of what it does.','up',142,'LIVE'),
('PROJECT B','b.revenantal.com','Tool','Tool for friends, added this week.','up',208,'NEW'),
('PROJECT C','c.revenantal.com','Sandbox','A longer one-line description that scrolls across the display.','up',212,''),
('PROJECT D','d.revenantal.com','Tool','A one-line description.','slow',1900,''),
('PROJECT E','e.revenantal.com','Site','A one-line description.','up',96,''),
('PROJECT F','f.revenantal.com','Sandbox','A one-line description.','down',0,''),
('PROJECT G','g.revenantal.com','Tool','A one-line description.','up',180,''),
('PROJECT H','h.revenantal.com','Site','A one-line description.','up',121,'')]
servers=[('SERVER 1','Survival','running',3,20,'4d','203.0.113.24:2456'),('SERVER 2','Sandbox','running',7,16,'11h','203.0.113.24:25565'),('SERVER 3','Racing','starting',0,10,'--','203.0.113.24:27015'),('SERVER 4','Co-op','offline',0,8,'--','203.0.113.24:7777')]
COL={'up':'#39ff6e','slow':'#ffae1a','down':'#ff3b3b','running':'#39ff6e','starting':'#ffae1a','offline':None}
WORD={'up':'UP','slow':'SLOW','down':'DOWN','running':'RUNNING','starting':'STARTING','offline':'OFFLINE'}
def build(view, sel):
    random.seed(21)
    def led(c,size=5,blink=None,flick=False):
        if not c: return f'<i class="k-led" style="width:{size}px;height:{size}px;background:#1a221c"></i>'
        a=f'animation:k-blink {blink:.2f}s steps(2) infinite;animation-delay:{random.uniform(0,1):.2f}s;' if blink else ''
        if flick: a=f'animation:k-flick{random.randint(1,3)} {random.uniform(.45,1.1):.2f}s steps(1) infinite;animation-delay:-{random.uniform(0,1):.2f}s;'
        return f'<i class="k-led" style="width:{size}px;height:{size}px;background:radial-gradient(circle at 35% 35%,#fff 0 15%,{c} 50%);box-shadow:0 0 {size}px {c},0 0 {size*2}px {c}66;{a}"></i>'
    def at(x,y,h): return f'<span style="position:absolute;left:{x}%;top:{y}%;transform:translate(-50%,-50%);display:flex;line-height:0">{h}</span>'
    def unit(kind,src,inner='',cls=''):
        return f'<div class="k-u {cls}" style="height:{HT[kind]}px"><img src="{src}" alt="" class="k-spr">{inner}</div>'
    def sep(title,sub,color,units):
        blank=unit('sep',B['blank'])
        disp=(f'<span style="position:absolute;left:88.65%;top:33.2%;transform:translate(-50%,-50%);display:flex;line-height:0">{led(color,6)}</span>'
              f'<span style="position:absolute;left:88.65%;top:49.2%;transform:translate(-50%,-50%);display:flex;line-height:0">{led(color,5,1.6)}</span>'
              f'<span class="k-lcd" style="left:64.5%;top:32%;width:14.5%;height:35%;justify-content:center;font-size:14px;color:#9fe0ff;background:#06121a;text-shadow:0 0 4px rgba(159,224,255,.7)">{units:02d} UNITS</span>'
              f'<span class="k-dmx" style="--c:{color};left:8.5%;right:54.1%"><span class="k-dmx-g"><span class="k-dmx-t"><b>{title}</b><span>{sub}</span></span></span></span>')
        return blank+unit('srv2u',B['srv2u'],disp).replace('class="k-spr"','class="k-spr" style="transform:scaleX(-1)"',1)
    out=[]; elev=[]  # elevation entries (name, height, colour, selected)
    # network
    keys=['#c8141e','#2a6ad8','#2a6ad8','#ffd400','#39b54a','#e8e8e8','#c8141e','#2a6ad8','#ff7bd5','#39b54a','#e8e8e8','#ffd400']
    ks=''.join(f'<i class="k-key">{"<i></i>" if i%2==0 and i//2<12 else ""}</i>' for i in range(24))
    out.append(unit('patch',B['patch'],f'<span class="k-strip" style="left:9%;top:9%">PATCH · 1–24</span><span style="position:absolute;left:8.6%;right:8.6%;top:40%;bottom:14%;display:flex;justify-content:space-between;align-items:center">{ks}</span>')); elev.append(('Patch panel',HT['patch'],'#8a909a',False))
    def prow(r):
        h=''
        for i in range(12):
            on = (r==0) or (random.random()<.35)
            lk=led("#39ff6e",3) if on else led(None,3)
            ac=led("#ffae1a",3,flick=True) if on else led(None,3)
            h+=f'<span class="k-port"><span style="display:flex;flex-direction:column;gap:2px;line-height:0">{lk}{ac}</span><i class="k-rj"></i></span>'
        return h
    out.append(unit('switch',B['switch'],at(8.16,51,led('#39ff6e',5))+f'<span style="position:absolute;left:13%;right:7.5%;top:22%;bottom:20%;display:flex;flex-direction:column;justify-content:space-between">'
        f'<span style="display:flex;justify-content:space-between">{prow(0)}</span><span style="display:flex;justify-content:space-between">{prow(1)}</span></span>')); elev.append(('Switch',HT['switch'],'#8a909a',False))
    up=sum(1 for p in projects if p[4]!='down')
    out.append(sep('PROJECTS',f'{up}/{len(projects)} UP','#4fb4ff',len(projects))); elev.append(('— Projects',HT['sep']+HT['srv2u']+1,'#57a8ff',False))
    for i,(n,h,typ,desc,st,ms,tag) in enumerate(projects):
        is_sel=(sel==('p',i))
        rd='DOWN' if st=='down' else (f'{ms/1000:.1f}s' if ms>=1000 else f'{ms}ms')
        lc={'down':' k-red','slow':' k-amb'}.get(st,'')
        inner=at(10.63,33.5,led(COL[st],5))+at(10.63,51.4,led('#39a8ff',4,flick=True) if st!='down' else led(None,4))+at(10.63,69.5,led('#39a8ff',4,flick=True) if st!='down' else led(None,4))
        t=f'<i class="k-tag">{tag}</i>' if tag else ''
        scroll=' k-marq' if is_sel and len(desc)>44 else ''
        inner+=(f'<span class="k-vfd{" k-on" if is_sel else ""}" style="left:15.5%;width:61%;top:17%;height:66%">'
                f'<span class="k-l1"><b>{n}</b>{t}<span style="margin-left:auto;color:{COL[st]}">● {WORD[st]}</span></span>'
                f'<span class="k-l2"><span class="k-dim">{h} · {typ} ·</span> <span class="{scroll.strip()}">{desc}</span></span></span>')
        inner+=f'<span class="k-lcd{lc}" style="left:80.8%;top:26%;width:9%;height:47%">{rd}</span>'
        out.append(unit('s1u',B['s1u'],inner,'k-sel' if is_sel else '')); elev.append((n.title(),HT['s1u'],COL[st],is_sel))
    run=sum(1 for s in servers if s[2]=='running')
    out.append(sep('GAME SERVERS',f'{sum(s[3] for s in servers)} PLAYERS','#ffae1a',len(servers))); elev.append(('— Game servers',HT['sep']+HT['srv2u']+1,'#ffae1a',False))
    for i,(n,game,st,p,mx,upt,addr) in enumerate(servers):
        is_sel=(sel==('s',i))
        trays=''.join(f'<span class="k-tray"><img src="{B["tray"]}" alt=""><span style="position:absolute;left:49.5%;top:7.8%;transform:translate(-50%,-50%);display:flex;line-height:0">{led(COL[st] if st!="offline" else None,2,random.uniform(.15,.9) if st=="running" else None)}</span></span>' for _ in range(8))
        inner=at(11.35,33.2,led(COL[st] or None,6))+at(11.35,49.2,led('#39a8ff',5,random.uniform(.2,.9)) if st=='running' else led(None,5))+at(11.35,65,led(None,5))
        c=COL[st] or '#6a7a70'
        pl=f'{p}/{mx} players · up {upt}' if st=='running' else ('booting…' if st=='starting' else 'last seen 2 days ago')
        l4='<span style="color:#fff">[ENTER] COPY ADDRESS</span>' if is_sel else '<span class="k-dim">connect from your game client</span>'
        inner+=(f'<span class="k-vfd k-big{" k-on" if is_sel else ""}{" k-offv" if st=="offline" else ""}" style="left:16%;width:43%;top:12%;height:76%">'
                f'<span class="k-l1"><b>{n}</b><span class="k-dim">&nbsp;· {game}</span><span style="margin-left:auto;color:{c}">● {WORD[st]}</span></span>'
                f'<span class="k-l2">{pl}</span>'
                f'<span class="k-l2"><span class="k-dim">CONNECT</span> <b style="color:#fff;letter-spacing:.04em">{addr}</b></span>'
                f'<span class="k-l2">{l4}</span></span>')
        inner+=f'<span style="position:absolute;left:62%;right:8.6%;top:10%;bottom:10%;display:flex;justify-content:space-between">{trays}</span>'
        out.append(unit('srv2u',B['srv2u'],inner,('k-sel ' if is_sel else '')+('k-dimu' if st=='offline' else ''))); elev.append((n.title(),HT['srv2u'],COL[st] or '#3a3f45',is_sel))
    out.append(sep('POWER','ON LINE','#39ff6e',1)); elev.append(('— Power',HT['sep']+HT['srv2u']+1,'#39ff6e',False))
    bars=''.join(f'<i style="display:inline-block;width:8px;height:12px;margin-right:3px;background:{"#39ff6e" if k<6 else "#14301c"};box-shadow:{"0 0 4px #39ff6e" if k<6 else "none"}"></i>' for k in range(10))
    out.append(unit('ups',B['ups'],f'<span class="k-vfd" style="left:11%;width:16.6%;top:26%;height:48%;justify-content:center"><span class="k-l2">ON LINE</span><span class="k-l2">BATT 100%</span></span>'+at(32.2,37.5,'<i class="k-ring"></i>')+f'<span style="position:absolute;left:58%;top:36%">{bars}</span><span class="k-small" style="position:absolute;left:58%;top:62%">LOAD 60% · 10 PLAYERS ONLINE</span>')); elev.append(('UPS',HT['ups'],'#39ff6e',False))
    # cables: patch jack (even keystones 0,2,..22) down to switch top-row port i
    sv=''
    PH=HT['patch']; SH=HT['switch']
    pj_y=PH*0.63
    span_k=EW*(1-2*0.086); kstep=(span_k-15)/23
    span_p=EW*(1-0.13-0.075); pstep=(span_p-18)/11
    sw_y=PH+1+SH*0.22+5
    for i in range(12):
        c=keys[i]
        x1=EW*0.086+(2*i)*kstep+7.5
        x2=EW*0.13+i*pstep+11.5
        drop=34+random.uniform(-5,8)
        d=f'M{x1:.1f} {pj_y+5:.1f} C {x1:.1f} {pj_y+drop+18:.1f}, {x2:.1f} {sw_y+drop:.1f}, {x2:.1f} {sw_y+5:.1f}'
        sv+=f'<path d="{d}" transform="translate(2 3)" stroke="rgba(0,0,0,.5)" stroke-width="5" fill="none" filter="url(#k-sh)"/>'
        sv+=f'<path d="{d}" stroke="#000" stroke-opacity=".6" stroke-width="4.6" fill="none"/>'
        sv+=f'<path d="{d}" stroke="{c}" stroke-width="3.4" fill="none"/>'
        sv+=f'<path d="{d}" transform="translate(-.8 0)" stroke="rgba(255,255,255,.4)" stroke-width=".9" fill="none"/>'
        for (bx,by) in [(x1,pj_y),(x2,sw_y)]:
            sv+=(f'<g transform="translate({bx:.1f} {by:.1f})"><rect x="-4" y="-4.5" width="8" height="10" rx="1.6" fill="{c}" stroke="#000" stroke-opacity=".55" stroke-width=".6"/>'
                 f'<rect x="-4" y="-4.5" width="8" height="10" rx="1.6" fill="url(#k-boot)"/><rect x="-2.6" y="-3" width="5.2" height="2.4" rx=".6" fill="rgba(0,0,0,.45)"/>'
                 f'<path d="M-2.6 1.5h5.2M-2.6 3.3h5.2" stroke="rgba(0,0,0,.35)" stroke-width=".6"/></g>')
    # velcro tie across the bundle
    sv+=f'<rect x="{EW*0.09:.0f}" y="{pj_y+17:.0f}" width="{EW*0.83:.0f}" height="0" fill="none"/>'
    cables=f'<svg viewBox="0 0 {EW} 130" width="{EW}" height="130" style="position:absolute;left:0;top:0;pointer-events:none;overflow:visible" aria-hidden="true"><defs><filter id="k-sh" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.5"/></filter><linearGradient id="k-boot" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient></defs>{sv}</svg>'
    rack_h=TOPH+sum(e[1]+1 for e in elev)+60
    # elevation minimap
    tot=sum(e[1]+1 for e in elev); sc=440/tot
    rows=''
    for name,h,c,s in elev:
        hh=max(6,h*sc)
        if name.startswith('—'):
            rows+=f'<div style="height:{hh:.1f}px;display:flex;align-items:flex-end;font-size:9px;font-weight:700;letter-spacing:.12em;color:{c};padding-bottom:1px">{name[2:].upper()}</div>'
        else:
            rows+=f'<div style="height:{hh-1:.1f}px;margin-bottom:1px;display:flex;align-items:center;gap:5px;padding:0 4px;border-radius:2px;background:{"#24405e" if s else "#1a1f26"};{"box-shadow:inset 0 0 0 1px #57a8ff;" if s else ""}font-size:9px;color:{"#fff" if s else "#9aa3ae"}"><i style="flex:none;width:5px;height:5px;border-radius:50%;background:{c}"></i>{name}</div>'
    cam=view  # px the rack is shifted up
    vis_top=max(0,(cam-TOPH))*sc; vis_h=570*sc
    html=f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>CH 10 · Status (rack)</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@500;700&amp;family=VT323&amp;family=Press+Start+2P&amp;display=swap" rel="stylesheet">
<style>
body{{margin:0}}
@keyframes k-blink{{0%,49%{{opacity:1}}50%,100%{{opacity:.15}}}}
@keyframes k-flick1{{0%{{opacity:1}}8%{{opacity:.12}}14%{{opacity:1}}33%{{opacity:.12}}39%{{opacity:1}}47%{{opacity:.12}}52%{{opacity:1}}71%{{opacity:.12}}78%{{opacity:1}}90%{{opacity:.12}}95%{{opacity:1}}}}
@keyframes k-flick2{{0%{{opacity:.12}}6%{{opacity:1}}22%{{opacity:.12}}27%{{opacity:1}}41%{{opacity:.12}}44%{{opacity:1}}60%{{opacity:.12}}66%{{opacity:1}}83%{{opacity:.12}}88%{{opacity:1}}}}
@keyframes k-flick3{{0%{{opacity:1}}12%{{opacity:.12}}17%{{opacity:1}}20%{{opacity:.12}}24%{{opacity:1}}50%{{opacity:.12}}57%{{opacity:1}}62%{{opacity:.12}}68%{{opacity:1}}85%{{opacity:.12}}}}
@keyframes k-marq{{0%,15%{{transform:translateX(0)}}85%,100%{{transform:translateX(-38%)}}}}
.k-u{{position:relative;margin-bottom:1px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.7))}}
.k-spr{{display:block;width:100%;height:100%}}
.k-sel{{outline:2px solid #57a8ff;outline-offset:1px;transform:translateX(-8px);filter:drop-shadow(8px 5px 7px rgba(0,0,0,.85));z-index:2}}
.k-dimu{{filter:brightness(.72)}}
.k-led{{display:inline-block;border-radius:50%}}
.k-vfd{{position:absolute;box-sizing:border-box;padding:3px 7px;display:flex;flex-direction:column;justify-content:space-around;border-radius:2px;background:linear-gradient(#04100f,#020807);box-shadow:inset 0 0 0 1px #000,inset 0 2px 6px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.06);font-family:'VT323',monospace;color:#6ff0ff;text-shadow:0 0 5px rgba(111,240,255,.55);overflow:hidden;white-space:nowrap}}
.k-vfd:after{{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.25) 0 1px,transparent 1px 2px),linear-gradient(115deg,rgba(255,255,255,.06),transparent 40%);pointer-events:none}}
.k-on{{box-shadow:inset 0 0 0 1px #57a8ff,inset 0 2px 6px rgba(0,0,0,.9),0 0 10px rgba(87,168,255,.35)}}
.k-offv{{color:#2e5a5e;text-shadow:none}}
.k-l1{{display:flex;align-items:baseline;gap:6px;font-size:15px;line-height:1}}
.k-l1 b{{font-weight:400;color:#e6fdff;letter-spacing:.04em}}
.k-l2{{font-size:13px;line-height:1;overflow:hidden}}
.k-l2>span{{display:inline-block}}
.k-big .k-l1{{font-size:15px}} .k-big .k-l2{{font-size:13px}}
.k-dim{{color:#3fa6b4;text-shadow:none}}
.k-marq{{animation:k-marq 7s ease-in-out infinite alternate}}
.k-tag{{font-style:normal;font-size:11px;padding:0 3px;border:1px solid #6ff0ff;line-height:1}}
.k-lcd{{position:absolute;display:flex;align-items:center;justify-content:flex-end;box-sizing:border-box;padding:0 4px;font-family:'VT323',monospace;font-size:15px;line-height:1;color:#78ff96;background:#061a0c;text-shadow:0 0 4px rgba(120,255,150,.7);white-space:nowrap;overflow:hidden}}
.k-red{{color:#ff6e6e;background:#1e0606;text-shadow:0 0 4px rgba(255,110,110,.7)}}
.k-amb{{color:#ffc45a;background:#1e1606;text-shadow:0 0 4px rgba(255,196,90,.7)}}
.k-dmx{{position:absolute;left:45.9%;right:8.5%;top:12%;bottom:12%;border-radius:2px;background-color:#060505;background-image:radial-gradient(circle,rgba(255,255,255,.075) 0 .75px,transparent .95px);background-size:2px 2px;box-shadow:inset 0 0 0 1px #000,inset 0 2px 5px rgba(0,0,0,.95),0 1px 0 rgba(255,255,255,.1);overflow:hidden}}
.k-dmx:after{{content:'';position:absolute;inset:0;background:linear-gradient(170deg,rgba(255,255,255,.09),transparent 45%);pointer-events:none}}
.k-dmx-g{{position:absolute;inset:0 10px;filter:drop-shadow(0 0 2px var(--c)) drop-shadow(0 0 5px var(--c))}}
.k-dmx-t{{position:absolute;inset:0;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:9px;font-family:'Press Start 2P',monospace;font-size:16px;line-height:1;color:var(--c);-webkit-mask-image:radial-gradient(circle,#000 0 .8px,transparent .95px);mask-image:radial-gradient(circle,#000 0 .8px,transparent .95px);-webkit-mask-size:2px 2px;mask-size:2px 2px}}
.k-dmx-t b{{font-weight:400}}
.k-strip{{position:absolute;font-family:'Archivo Narrow',sans-serif;font-weight:700;font-size:7px;letter-spacing:.2em;color:#2a2a3a}}
.k-key{{display:flex;justify-content:center;width:13px;height:12px;background:#050506;border:1px solid #4a4d55;box-shadow:inset 0 1px 2px #000}}
.k-key i{{display:block;width:7px;height:7px;margin-top:1px;background:#0b0c0e}}
.k-port{{display:flex;align-items:center;gap:2px}}
.k-rj{{display:block;width:13px;height:10px;background:#030304;border:1px solid #5a5e66;border-radius:1px;box-shadow:inset 0 2px 2px #000}}
.k-tray{{position:relative;height:100%}}
.k-tray img{{display:block;height:100%}}
.k-ring{{display:block;width:11px;height:11px;border-radius:50%;box-shadow:0 0 0 1.5px #39ff6e,0 0 6px #39ff6e}}
.k-small{{font-family:'Archivo Narrow',sans-serif;font-weight:700;font-size:9px;letter-spacing:.14em;color:#9aa0aa;white-space:nowrap}}
</style>
</helmet>
<div style="position: relative; width: 760px; height: 570px; overflow: hidden; background: radial-gradient(ellipse at 40% 0%, #2c3b4e 0%, #0e141c 55%, #05070a 100%); font-family: 'Archivo Narrow', sans-serif">
  <div style="position: absolute; left: 70px; top: {-cam}px; width: {CABW}px; height: {rack_h}px">
    <img src="{B['top']}" alt="" style="display:block;width:100%;height:{TOPH}px">
    <div style="position:absolute;left:0;top:{TOPH}px;width:100%;bottom:0;background:url({B['mid']}) 0 0/{CABW}px 183.12px repeat-y"></div>
    <div style="position:absolute;left:{EAR}px;top:{TOPH}px;width:{EW}px">{''.join(out)}{cables}</div>
  </div>
  <div style="position: absolute; left: 0; right: 0; top: 0; height: 40px; background: linear-gradient(rgba(5,7,10,.85), transparent); pointer-events: none"></div>
  <div style="position: absolute; left: 0; right: 0; bottom: 0; height: 50px; background: linear-gradient(transparent, rgba(5,7,10,.9)); pointer-events: none"></div>

  <div style="position: absolute; right: 12px; bottom: 8px; font-size: 10px; color: #8a93a0">7:42 PM · next poll in 8 min · ↑↓ select · Enter open / copy</div>
</div>
</x-dc>
</body>
</html>
'''
    return html
def main():
    """Generate rack references in an explicit output folder without replacing approved boards."""
    parser = argparse.ArgumentParser(description="Generate the two Status rack HTML references.")
    parser.add_argument("--output-dir", type=Path, default=Path(__file__).resolve().parent / "renders")
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    for name, view, selected in [
        ("ChStatusRack.dc.html", 180, ("p", 2)),
        ("ChStatusRack2.dc.html", 860, ("s", 0)),
    ]:
        (args.output_dir / name).write_text(build(view, selected), encoding="utf-8")
        print(f"Generated {name}")


if __name__ == "__main__":
    main()
