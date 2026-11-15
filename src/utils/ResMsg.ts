export const ResMsg=(
    res:any,
    statusCode:number,
    successFlag:boolean,
    message:string,
    data?:any
)=>{
return res.status(statusCode).json({
    success:successFlag,
    message:message,
    data:data
})
}
export const isValidUUID = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);