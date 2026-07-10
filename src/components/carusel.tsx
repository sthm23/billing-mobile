import { ScrollView } from "react-native"




const Carousel = (props:any) => {
  return (
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {props.children}
        </ScrollView>
  )
}

export default Carousel