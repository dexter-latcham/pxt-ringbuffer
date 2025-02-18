//TODO
//when an unexpected float is inputted switch from storing ints
//test memory constraints
//better tooltips to explain the advanced usage
//sometimes .append isn't picked up as a block for the float class

enum StoreChoice{
    //% block="Float"
    Float=1,
    //% block="Integer"
    Integer=0,
    //% block="Integer 32 bit"
    Integer32=2
}

enum BufferMemorySize{
    //% block="Low"
    Low=1,
    //% block="Medium"
    Medium=2,
    //% block="High"
    High=3
}

//% color="#FF8000"
namespace ringBuffer{
    export class circularBufferInstance{
        _buffers: Buffer[] = [];
        _maxAllocationSize=10000;
        _maxBufferContent = 0;
        _bufferCount = 0;
        _maxElements=1;
        _start = 0;
        _size = 0;

        appendFunc: (value:number)=>void;
        getFunc: (index:number)=>number;
        setPinBufferFunc:(arrayIndex:number,index:number,value:number)=>void;
        getPinBufferFunc:(arrayIndex:number,index:number)=>number;
        constructor(dataType=StoreChoice.Integer,numBuffers=3) {
            this._bufferCount=numBuffers
            if(dataType == StoreChoice.Integer32){
                this._maxBufferContent = this._maxAllocationSize/4
                this.setPinBufferFunc=(arrayIndex:number,index:number,value:number)=>{
                    this._buffers[arrayIndex].setNumber(NumberFormat.Int32LE, index * 4, value);
                }
                this.getPinBufferFunc=(arrayIndex:number,index:number)=>{
                    return this._buffers[arrayIndex].getNumber(NumberFormat.Int32LE, index * 4);
                };
            }else{
                this._maxBufferContent = this._maxAllocationSize/4
                this.setPinBufferFunc=(arrayIndex:number,index:number,value:number)=>{
                    this._buffers[arrayIndex].setNumber(NumberFormat.Int16LE, index * 2, value);
                }
                this.getPinBufferFunc=(arrayIndex:number,index:number)=>{
                    return this._buffers[arrayIndex].getNumber(NumberFormat.Int16LE, index * 2);
                };
            }

            this._maxElements = this._maxBufferContent * this._bufferCount;
            this._buffers = [];
            for (let i = 0; i < this._bufferCount; i++) {
                this._buffers.push(pins.createBuffer(this._maxBufferContent));
            }
            this._start = 0;
            this._size = 0;
            
            if(dataType == StoreChoice.Float){
                this.appendFunc=(value:number)=>{this.appendFloat(value)};
                this.getFunc=(index:number)=>{return this.getFloat(index)};
            }else{
                this.appendFunc=(value:number)=>{return this.appendInt(value)};
                this.getFunc=(index:number)=>{return this.getInt(index)};
            }
        }

        /**
         * append value to buffer
         * @param value value to insert
         */
        //% block="append $value to $this"
        //% value.min=-32768 value.max=32767
        //% weight=150
        //% this.defl=buffer
        //% this.shadow=variables_get
        //% value.defl=0
        append(value: number): void{
            this.appendFunc(value);
        }

        appendInt(value: number): void{
            let index = (this._start + this._size) % this._maxElements;
            let arrayToInsert = Math.floor(index / this._maxBufferContent);
            let arrayIndex = index - (arrayToInsert * this._maxBufferContent);

            if (this._size < this._maxElements) {
                this.setPinBufferFunc(arrayToInsert,arrayIndex,value);
                this._size++;
            } else {
                arrayToInsert = Math.floor(this._start / this._maxBufferContent);
                arrayIndex = this._start - (arrayToInsert * this._maxBufferContent);
                this.setPinBufferFunc(arrayToInsert,arrayIndex,value);
                this._start = (this._start + 1) % this._maxElements;
            }
        }

        appendFloat(value: number): void{
            this.appendInt(circularBufferInstance.toHalfPrecisionFloat(value));
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
            return this.getFunc(index);
        }

        getInt(index:number): number {
            if (index < 0 || index >= this._size) {
                return 0;
            }
            let wholeIndex = (this._start + index) % this._maxElements;
            let arrayToInsert = Math.floor(wholeIndex / this._maxBufferContent);
            let arrayIndex = wholeIndex - (arrayToInsert * this._maxBufferContent);

            return this.getPinBufferFunc(arrayToInsert,arrayIndex);
        }

        getFloat(index:number): number {
            return circularBufferInstance.fromHalfPrecisionFloat(this.getInt(index))
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

        static toHalfPrecisionFloat(value: number) {
            if (value === 0){return 0;}
            let sign = 0, exponent = 0, mantissa = 0;
            if (value < 0) {
                sign = 1;
                value = -value;
            }

            if (value === 0) {
                return 0;
            }

            while (value >= 2) {
                value /= 2;
                exponent++;
            }

            while (value < 1) {
                value *= 2;
                exponent--;
            }
            exponent += 15; // 15 offset
            if (exponent >=31){
               //+inf
                return (sign<<15) | (0x1F <<10)
            }
            if (exponent <=0){
                //denormalise, exponent=0
                exponent=0
                mantissa = value
            }else{
                mantissa = value - 1;//remove leading 1 from mantissa
            }
            mantissa = Math.floor(mantissa * (2**10))
            return (sign << 15) | (exponent << 10) | mantissa;
        }

        static fromHalfPrecisionFloat(value:number):number {
            let sign = (value >> 15) & 0x1;
            let exponent = (value >> 10) & 0x1F;  // 5 bits for exponent
            let mantissa = value & 0x3FF;  // 10 bits for mantissa

            //special exponent handling
            if (exponent === 0) {
                if (mantissa === 0) {
                    return 0.0;
                } else {
                    // no leading 1 in mantissa
                    return Math.pow(-1, sign) * (mantissa / Math.pow(2, 10)) * Math.pow(2, -14);
                }
            }

            // add back implicit bit
            mantissa = 1 + (mantissa / Math.pow(2, 10));
            //remove offset from exponent

            let actualExponent = exponent - 15;
            return Math.pow(-1, sign) * mantissa * Math.pow(2, actualExponent);
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
    
    /**
     * Create a buffer widget and automtically set it to a variable
     */
    //% block="create buffer || storing $storeType | memory use $bufferLevel"
    //% storeType.defl=StoreChoice.Integer
    //% bufferLevel.defl=BufferMemorySize.High
    //% weight=200
    //% blockSetVariable=buffer
    //% advanced=true
    //% expandableArgumentMode="enabled"
    //% inlineInputModeLimit=1
    //%inlineInputMode=variable
    export function createBufferAdv(storeType:StoreChoice=StoreChoice.Integer, bufferLevel:BufferMemorySize=BufferMemorySize.High): circularBufferInstance{
        return new circularBufferInstance(storeType,bufferLevel);
    }
}
