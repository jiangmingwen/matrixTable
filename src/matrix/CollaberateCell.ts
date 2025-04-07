import { Rect, Text } from '@antv/g'
import { IS2Options } from "./type";
import { CellClipBox, PivotSheet } from '@antv/s2';
import { getS2Key } from './config';
import { MatrixDataCell } from './DataCell';

export class CollaberateCell {
    text: string
    shape?: Rect
    spreadsheet: PivotSheet

    rowKey: string
    colKey: string

    constructor(spreadsheet: PivotSheet, text: string, rowKey: string, colKey: string) {
        this.spreadsheet = spreadsheet
        this.text = text
        this.colKey = colKey
        this.rowKey = rowKey
    }

    get options() {
        return this.spreadsheet.options as IS2Options
    }

    remove() {
        if (this.shape)
            this.spreadsheet.getCanvas().removeChild(this.shape)
    }

    show() {
        this.shape = this.drawRect(this.text)
        if (this.shape)
            this.spreadsheet.getCanvas().appendChild(this.shape)
    }


    private drawRect(text: string) {
        const cornerHeader = this.spreadsheet.facet.cornerHeader.getBBox()
        const scrollX = this.spreadsheet.store.get("scrollX")
        const scrollY = this.spreadsheet.store.get("scrollY")
        const dataCell = this.spreadsheet.facet.getCellById(getS2Key(this.rowKey, this.colKey, this.options.showCount)) as MatrixDataCell
        if (!dataCell) return
        const {  width,height } = dataCell.getBBoxByType(CellClipBox.BORDER_BOX);
       let {x,y} = dataCell.getMeta()
        x += cornerHeader.width - scrollX
        y += cornerHeader.height - scrollY
        const rect = new Rect({
            name: 'collaberate-cell',
            style: {
                x,
                y,
                width: width,
                height: height,
                fill: 'transparent',
                stroke: '#ffb400',
                strokeWidth: 1,
                zIndex:1,
            },
            
        });
        rect.style.pointerEvents = 'none'
        const textTip = `${text} 正在编辑`
        const rectTip = new Rect({
            name: 'collaberate-cell-text',
            style: {
                x,
                y,
                width: textTip.length * 12,
                height: 16,
                fill: '#ffb400',
                stroke: '#ffb400',
                strokeWidth: 1,
                zIndex: 9
            },
        });
        const textShape = new Text({
            style: {
                x: x + 4,
                y: y + 16,
                fill: '#fff',
                text: textTip,
                maxLines: 1,
                fontSize: 12,
            },
        });
        rectTip.appendChild(textShape)
        rect.appendChild(rectTip)
        return rect
    }



}