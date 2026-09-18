// 생성 도구가 만든 4×4 시트는 칸 간격이 고르지 않다. 불투명 픽셀이 가장 적은 "골짜기"를
// 칸 경계로 삼고, 칸마다 그림의 경계 상자를 찾는다. prepare-dance-frames.mjs가 쓴다.

function valley(counts, expected, radius) {
  const lo = Math.max(1,Math.round(expected-radius));
  const hi = Math.min(counts.length-1,Math.round(expected+radius));
  let best = lo, score = Infinity;
  for(let i=lo;i<=hi;i++) {
    let density=0;
    for(let j=Math.max(lo,i-3);j<=Math.min(hi,i+3);j++) density+=counts[j];
    const cost=density + Math.abs(i-expected)*.03;
    if(cost<score){score=cost;best=i;}
  }
  return best;
}

/**
 * @param {{data: Buffer, info: {width: number, height: number}}} raw RGBA raw buffer of the sheet
 * @returns {{row: number, col: number, left: number, top: number, width: number, height: number}[]} 16 cells, row-major
 */
export function findSheetCells({ data, info }) {
  const rows=Array(info.height).fill(0);
  for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) if(data[(y*info.width+x)*4+3]>160)rows[y]++;
  const ys=[0,...[1,2,3].map(i=>valley(rows,info.height*i/4,info.height*.045)),info.height];
  const cells=[];
  for(let row=0;row<4;row++) {
    const columns=Array(info.width).fill(0);
    for(let y=ys[row];y<ys[row+1];y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>160)columns[x]++;
    const xs=[0,...[1,2,3].map(i=>valley(columns,info.width*i/4,info.width*.04)),info.width];
    for(let col=0;col<4;col++) {
      let left=xs[col+1],right=xs[col],top=ys[row+1],bottom=ys[row];
      // Ignore isolated transparency fringes by requiring nearby opaque pixels.
      for(let y=ys[row]+1;y<ys[row+1]-1;y++)for(let x=xs[col]+1;x<xs[col+1]-1;x++) {
        const idx=(y*info.width+x)*4;
        if(data[idx+3]>220 && data[idx-4+3]>160 && data[idx+4+3]>160) {
          left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
        }
      }
      left=Math.max(xs[col],left-2);right=Math.min(xs[col+1]-1,right+2);
      top=Math.max(ys[row],top-2);bottom=Math.min(ys[row+1]-1,bottom+2);
      cells.push({row,col,left,top,width:right-left+1,height:bottom-top+1});
    }
  }
  return cells;
}
