document.getElementById("checkData").addEventListener("click",()=> {
    document.getElementById("result").innerText="Fetching your data footprint...";
    setTimeout(()=>{
        document.getElementById("result").innerText = "Scan is Complete! You visited 0  Sites today";
    }, 1500);
});
