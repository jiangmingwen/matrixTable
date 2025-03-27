import { PanelBBox, PivotSheet } from '@antv/s2'
import { IImageInfo } from './type'

/** 单链表 */
export class CanvasNode {
  canvas: HTMLCanvasElement
  /** 当前图片的x坐标 */
  x: number = 0
  /** 图片的Y坐标 */
  y: number = 0

  appendX: number = 0

  appendY: number = 0

  scrollWidth: number

  scollHeight: number

  next?: CanvasNode

  prev?: CanvasNode

  cornerWidth: number

  cornerHeight: number

  /** 每次追加的图片的宽度 */
  imageChunkWidth: number;
  /** 每次追加的图片的高度 */
  imageChunkHeight: number;

  isFirstCol = false
  isFirstRow = false


  constructor(width: number, height: number, panelBox: PanelBBox, sourceCanvas: HTMLCanvasElement) {
    this.canvas = document.createElement('canvas')
    this.canvas.width = width
    this.canvas.height = height
    this.imageChunkWidth = sourceCanvas.width
    this.imageChunkHeight = sourceCanvas.height
    this.cornerWidth = sourceCanvas.width - panelBox.viewportWidth;
    this.cornerHeight = sourceCanvas.height - panelBox.viewportHeight;
    this.scrollWidth = width
    this.scollHeight = height

  }

  toImage() {
    const image = this.canvas.toDataURL('image/png')
    const imageNode = document.createElement('img')
    imageNode.src = image
    return imageNode
  }
  /** 导出图片信息为数组 */
  toImageList() {
    const imageList: IImageInfo[] = []
    let node: CanvasNode | undefined = this
    while (node) {
      imageList.push({
        data: node.canvas.toDataURL('image/png'),
        x: node.x,
        y: node.y,
        width: node.canvas.width,
        height: node.canvas.height
      })
      node = node.next
    }
    return imageList
  }

  get isComplete() {
    return this.remainWidth <= 0 && this.remainHeight <= 0
  }

  get remainWidth() {
    return this.canvas.width - this.appendX - (this.isFirstCol ? this.cornerWidth : 0)
  }

  get remainHeight() {
    return this.canvas.height - this.appendY - (this.isFirstRow ? this.cornerHeight : 0)
  }

  get perScollWidth() {
    return this.imageChunkWidth - this.cornerWidth
  }

  get perScollHeight() {
    return this.imageChunkHeight - this.cornerHeight
  }

  private get isLastX() {
    //是不是最后一个x
    return this.remainWidth < this.perScollWidth
  }

  private get isLastY() {
    //是不是最后一个x
    return this.remainHeight < this.perScollHeight
  }



  private getData() {
    let sx = 0;
    let sy = 0;
    let swidth = this.perScollWidth//即 viewpointWidth
    let sheight = this.perScollHeight //即 viewportHeight
    let x = this.appendX;
    let y = this.appendY;

    if (this.x === 0) {
      // 带列表头的图片
      if (this.appendX === 0) {
        x = 0
        swidth = this.imageChunkWidth // 每一行的第一个图片,第一次追加，宽度不进行裁剪
        sx = 0;
      } else {
        x = this.cornerWidth + this.appendX
        sx = this.cornerWidth
        swidth = this.imageChunkWidth - this.cornerWidth
      }
    } else {
      sx = this.cornerWidth
      swidth = this.imageChunkWidth - this.cornerWidth
      x = this.appendX;
    }


    if (this.y === 0) {
      //第一行,高度不进行裁剪
      if (this.appendY === 0) {
        y = 0
        sy = 0;
        sheight = this.imageChunkHeight
      } else {
        y = this.cornerHeight + this.appendY
        sy = this.cornerHeight
        sheight = this.imageChunkHeight - this.cornerHeight

      }
    } else {
      //进行裁剪，裁掉表头
      sy = this.cornerHeight;
      sheight = this.imageChunkHeight - this.cornerHeight
      y = this.appendY;
    }
    // 如果是最后一个图片拼接，需要根据剩下的尺寸进行裁剪
    if (this.isLastX && this.canvas.width > this.perScollWidth && this.remainWidth > 0) {
      sx = this.imageChunkWidth - this.remainWidth
      swidth = this.remainWidth;
    }

    if (this.isLastY && this.canvas.height > this.perScollHeight && this.canvas.height > sheight) {
      sy = this.imageChunkHeight - this.remainHeight
      sheight = this.remainHeight
    }

    return {
      sx,
      sy,
      swidth,
      sheight,
      x,
      y
    }
  }


  drawImage(image: HTMLImageElement) {
    const ctx = this.canvas.getContext('2d')

    if (!ctx) {
      this.appendX = this.canvas.width;
      this.appendY = this.canvas.height;
      return
    };
    const { sx, sy, swidth, sheight, x, y } = this.getData()
    ctx.drawImage(
      image,
      sx,
      sy,
      swidth,
      sheight,
      x,
      y,
      swidth,
      sheight
    )

    // 增加每次滚动的宽度
    this.appendX += swidth >= this.perScollWidth ? this.perScollWidth : swidth;
    if (this.remainWidth <= 0) { // 横向绘制完成了
      this.appendY += sheight >= this.perScollHeight ? this.perScollHeight : sheight;
      if (this.remainHeight > 0) {
        this.appendX = 0;
      }
    }
    return this
  }

  static create(width: number, height: number, panelBox: PanelBBox, sourceCanvas: HTMLCanvasElement) {
    return new CanvasNode(width, height, panelBox, sourceCanvas)
  }
}



export class Exporter {
  instance: PivotSheet
  dom: HTMLDivElement

  constructor(sourceInstace: PivotSheet) {
    const dom = document.createElement('div')
    dom.style.position = 'absolute'
    dom.style.top = '0'
    dom.style.left = '0'
    dom.style.zIndex = '-99'
    dom.style.visibility = 'hidden'
    document.body.appendChild(dom)
    this.dom = dom;
    this.instance = new PivotSheet(dom, sourceInstace.dataCfg, {
      ...sourceInstace.options,
      frozen: {
        rowHeader: false,
        colCount: 0
      }
    })
    // 隐藏滚动条
    this.instance.setTheme({
      scrollBar: {
        size: 0
      },
    })
  }

  linkList?: CanvasNode

  /**
   * 生成图片布局信息
   * @returns 
   */
  getImageLayout(instanceCanvas: HTMLCanvasElement) {
    const { originalHeight, originalWidth, viewportHeight, viewportWidth } = this.instance.facet.panelBBox
    const cornerWidth = instanceCanvas.width - viewportWidth;
    const cornerHeight = instanceCanvas.height - viewportHeight;
    const widthLimit = 15000 - cornerWidth;
    const heightLimit = 15000 - cornerHeight;
    const widthCount = Math.ceil(originalWidth / widthLimit)
    const heightCount = Math.ceil(originalHeight / heightLimit)
    /** 单个canvas的平均宽度和高度：例如总宽为40000PX。每个宽度则为20000 */
    const perWidthSize = originalWidth / widthCount;
    const perHeightSize = originalHeight / heightCount;
    /** 创建双链表 */
    return this.createLinkList(heightCount, widthCount, perWidthSize, perHeightSize, cornerWidth, cornerHeight, this.instance.facet.panelBBox, instanceCanvas)
  }


  async export(cb: (linkList: CanvasNode) => void) {
    await this.instance.render();
    const instanceCanvas = this.instance.getCanvasElement()
    // 创建双链表,生成图片布局信息
    this.linkList = this.getImageLayout(instanceCanvas)
    let timer = setTimeout(() => {
      clearTimeout(timer);
      this.scrollViewPoint(instanceCanvas, cb, this.linkList)
    }, 10);

  }


  /** 滚动视口宽度进行导出 */
  async scrollViewPoint(instanceCanvas: HTMLCanvasElement, cb: (linkList: CanvasNode) => void, currentNode?: CanvasNode) {
    while (!!currentNode) {
      if (currentNode.isComplete) {
        currentNode = currentNode.next
      }
      if (currentNode) {
        await this.appendImageToNode(currentNode, cb, instanceCanvas)
      }
    }
  }

  private async appendImageToNode(currentNode: CanvasNode, cb: (linkList: CanvasNode) => void, instanceCanvas: HTMLCanvasElement) {
    let scrollX = currentNode.x === 0 ? (currentNode.x + currentNode.appendX) : (currentNode.x + currentNode.appendX + currentNode.cornerWidth)
    let scrollY = currentNode.y === 0 ? (currentNode.y + currentNode.appendY) : (currentNode.y + currentNode.appendY + currentNode.cornerHeight)
    const image = await this.scrollAndToImage(instanceCanvas, scrollX, scrollY)
    currentNode.drawImage(image)
    if (currentNode.isComplete) {
      cb(this.linkList!)
    }
  }

  /** 滚动到对应位置，再进行图片导出 */
  private async scrollAndToImage(instanceCanvas: HTMLCanvasElement, x: number, y: number): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      this.instance.interaction.scrollTo({
        skipScrollEvent: true,
        offsetX: {
          value: x,
          animate: false
        },
        offsetY: {
          value: y,
          animate: false
        }
      })
      let timer = setTimeout(() => {
        clearTimeout(timer)
        const image = instanceCanvas.toDataURL('image/png')
        const imageNode = document.createElement('img')
        imageNode.src = image
        resolve(imageNode)
      }, 0);
    })
  }


  /**
   * 
   * @param rowCount 几行图片
   * @param colCount 几列图片
   * @param canvasWidth 每个图片的宽度
   * @param canvasHeight 每个图片的高度
   * @param panelBBox 
   * @param sourceCanvas 
   * @returns 
   */
  createLinkList(rowCount: number,
    colCount: number,
    canvasWidth: number,
    canvasHeight: number,
    cornerWidth: number,
    cornerHeight: number,
    panelBBox: PanelBBox,
    sourceCanvas: HTMLCanvasElement


  ) {

    let firstNode: CanvasNode | undefined
    let prevNode: CanvasNode | undefined
    let width = canvasWidth;
    let height = cornerHeight;
    for (let i = 0; i < colCount; i++) {
      if (i === 0) {
        width = canvasWidth + cornerWidth
      } else {
        width = canvasWidth
      }
      let x = i * canvasWidth + (i === 0 ? 0 : cornerWidth)
      for (let j = 0; j < rowCount; j++) {
        if (j === 0) {
          height = canvasHeight + cornerHeight
        } else {
          height = cornerHeight;
        }
        let y = j * canvasHeight + (j === 0 ? 0 : cornerHeight);
        const canvasNode = CanvasNode.create(width, height, panelBBox, sourceCanvas);
        canvasNode.isFirstCol = i === 0
        canvasNode.isFirstRow = j === 0
        canvasNode.x = x;
        canvasNode.y = y;
        if (prevNode) {
          prevNode.next = canvasNode
        }
        if (!firstNode) {
          firstNode = canvasNode
        }
        canvasNode.prev = prevNode
        prevNode = canvasNode
      }
    }
    return firstNode
  }
}
