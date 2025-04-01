import { MatrixCanvas } from './matrix'
import { IDataType, IMatrixCanvasInstance } from './matrix/type'
import Icon from './assets/react.svg'
import { useRef, useState } from 'react'
import './App.css'


const lib = "饿我去恶趣味及配件啊顺丰到付圣诞节快乐放假啊是萨科"

function getTextRandom(max: number = 10) {
  let count = Math.floor(Math.random() * max) + 10
  let text = ""
  for (let i = 0; i < count; i++) {
    text += lib[Math.floor(Math.random() * lib.length)]
  }
  return text
}

function createHeaders(count: number) {
  const _cols: IDataType[] = []
  const _rows: IDataType[] = []

  for (let i = 0; i < count; i++) {
    const col = { key: `col${i}`, title: `${getTextRandom()}`, children: [] } as any
    const row = { key: `row${i}`, title: `${getTextRandom()}`, children: [] } as any
    for (let j = 0; j < count; j++) {
      col.children.push({
        key: `col${i}-${j}`,
        title: `${getTextRandom()}`,
        children: [
          {
            key: `col${i}-${j}-1`,
            title: `${getTextRandom()}`,
          },
          {
            key: `col${i}-${j}-2`,
            title: `${getTextRandom()}`,
          }
        ]
      })
      row.children.push({
        key: `row${i}-${j}`,
        title: `${getTextRandom()}`,
        children: [
          {
            key: `row${i}-${j}-1`,
            title: `${getTextRandom()}`,
          },
          {
            key: `row${i}-${j}-2`,
            title: `${getTextRandom()}`,
          }
        ]
      })
    }
    _cols.push(col)
    _rows.push(row)
  }
  return [_rows, _cols]
}


function App() {
  const checredf = useRef({} as any)
  const instance = useRef<IMatrixCanvasInstance>(null)
  const [cols, setCols] = useState<any>([])
  const [rows, setRows] = useState<any>([])

  return (
    <>
      <button onClick={() => {
        setRows(createHeaders(15)[0])
      }} >改变行</button>
      <button onClick={() => {
        setCols(createHeaders(15)[1])

      }} >改变列</button>
      <button onClick={() => {
        setRows([])

      }} >清空行</button>
      <button onClick={() => {
        setCols([])

      }} >清空列</button>
      <button onClick={() => {
        instance.current?.export().then(res=> {
          console.log(res,'xx')
        })
      }} >导出</button>
      <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
        <div style={{ width: "1000px", height: "500px" }}>
          <MatrixCanvas colHeaders={cols}
          ref={instance}
            rowHeaders={rows}
            renderHeaderIcon={() => Icon}
            size={80}
            renderCell={(rowKey, colKey) => {
              return {
                type: 'text',
                value: `${rowKey}__${colKey}`,
              }
              // if (rowKey === 'row0') {
              //   return {
              //     type: 'empty',
              //     disabled: true
              //   }
              // }

              // if (rowKey === 'row0-1') {
              //   return {
              //     type: 'image',
              //     value: [Icon, Icon],
              //     disabled: true
              //   }
              // }

              // if (rowKey === 'row1') {
              //   return {
              //     type: 'empty',
              //     disabled: false
              //   }
              // }
              // return {
              //   type: 'checkbox',
              //   value: checredf.current[`${rowKey}__${colKey}`] ?? false
              // }
            }}
            renderCount={(k, c, r) => {
              if (r) {
                console.log(k, c, r)
              }
              return 100
            }}

            renderCornerCell={() => {
              return {
                type:'custom',
                renderFn: (w,h)=>{
                  return [
                    {
                      type: 'text',
                      data: '123',
                      x: w/2,
                      y: h/2,
                      size: 30
                    }
                  ]
                }
              }
            }}

            tooltip={
              (_r, _k) => {
                return '123'
              }
            }
            onCheck={(r, c, v, u) => {
              checredf.current[`${r}__${c}`] = v
              u()
            }}

            onDataSelect={(s) => {
              console.log(s, 'dataSelect')
            }}
            onRowSelect={(s) => {
              console.log(s, 'onRowSelect')
            }}

            onColSelect={(s) => {
              console.log(s, 'onColSelect')
            }}

            onContextMenu={(s, x, y, rowKey, colKey) => {
              console.log(s, x, y, rowKey, colKey, 'onContextMenu')
            }}
          // emptyDataText='单元格数据为空'
          ></MatrixCanvas>
        </div>
      </div>
        <div style={{ height: '100%'}} id="addix"></div>
    </>
  )
}

export default App
