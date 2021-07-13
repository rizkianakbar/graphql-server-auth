import { Arg, Mutation, Query, Resolver } from "type-graphql";
import { hash } from 'bcryptjs'
import { User } from "../entity/User";
@Resolver()
export class UserResolver {
    @Query(() => String)
    hello() {
        return 'Hi!'
    }

    @Query(() => [User])
    users() {
        return User.find()
    }

    @Mutation(() => Boolean)
    async register(
        @Arg('firstName') firstName: string,
        @Arg('lastName') lastName: string,
        @Arg('email') email: string,
        @Arg('password') password: string,
    ) {
        const hashed = await hash(password, 12)

        try {
            await User.insert({
                firstName,
                lastName,
                email,
                password: hashed,
            })
        } catch (err) {
            console.log(err)
            return false

        }
        return true;
    }
}