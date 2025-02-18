//% color="#FF8000"
namespace ringBuffer{
    export class circularBufferInstance{
        _buffers: Buffer[] = [];
        _maxBufferContent = 2;
        _bufferCount = 3;
        _maxElements=1;
        _start = 0;
        _size = 0;

        constructor() {
            this._maxElements = this._maxBufferContent * this._bufferCount;
            this._buffers = [];
            for (let i = 0; i < this._bufferCount; i++) {
                this._buffers.push(pins.createBuffer(this._maxBufferContent * 2));
            }
            this._start = 0;
            this._size = 0;
        }
        /**
         * append value to buffer
         * @param value value to insert
         */
        //% block="append $value to $this"
        //% weight=150
        //% this.defl=buffer
        //% this.shadow=variables_get
        //% value.defl=0
        append(value: number): void{
            let index = (this._start + this._size) % this._maxElements;
            let arrayToInsert = Math.floor(index / this._maxBufferContent);
            let arrayIndex = index - (arrayToInsert * this._maxBufferContent);

            if (this._size < this._maxElements) {
                this._buffers[arrayToInsert].setNumber(NumberFormat.Int16LE, arrayIndex * 2, value);
                this._size++;
            } else {
                arrayToInsert = Math.floor(this._start / this._maxBufferContent);
                arrayIndex = this._start - (arrayToInsert * this._maxBufferContent);
                this._buffers[arrayToInsert].setNumber(NumberFormat.Int16LE, arrayIndex * 2, value);
                this._start = (this._start + 1) % this._maxElements;
            }
        }

        /**
         * Get value at an index
         * @returns the value
         */
        //% block="get value at $index of $this"
        //% weight=140
        //% this.defl=buffer
        //% this.shadow=variables_get
        get(index:number): number {
            if (index < 0 || index >= this._size) {
                return 0;
            }
            let wholeIndex = (this._start + index) % this._maxElements;
            let arrayToInsert = Math.floor(wholeIndex / this._maxBufferContent);
            let arrayIndex = wholeIndex - (arrayToInsert * this._maxBufferContent);
            return this._buffers[arrayToInsert].getNumber(NumberFormat.Int16LE, arrayIndex * 2);
        }


        /**
         * Get the number of elements in a buffer
         * @returns the number of elements
         */
        //% block="element count of $this"
        //% weight=120
        //% this.defl=buffer
        //% this.shadow=variables_get
        length(): number {
            return this._size;
        }


        /**
         * is the buffer fully populated
         * @returns true if buffer full
         */
        //% block="is $this full"
        //% weight=110
        //% this.defl=buffer
        //% this.shadow=variables_get
        full(): boolean {
            return this._size == this._maxElements;
        }

        /**
         * maximum buffer size
         * @returns max size
         */
        //% block="maximum elements of $this"
        //% weight=130
        //% this.defl=buffer
        //% this.shadow=variables_get
        getMaxElements(): number {
            return this._maxElements;
        }
    }

   /**
     * Create a buffer widget and automtically set it to a variable
     */
    //% block="create buffer"
    //% weight=200
    //% blockSetVariable=buffer
    export function createBuffer(): circularBufferInstance {
        return new circularBufferInstance();
    }
}
